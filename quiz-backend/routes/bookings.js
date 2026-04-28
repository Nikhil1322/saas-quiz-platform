const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyMerchantToken } = require('../middleware/auth');

// ─── PUBLIC ROUTES (for customers) ─────────────────────────

router.get('/public/event-details', (req, res) => {
    const { subdomain, eventSlug } = req.query;
    db.query(
        "SELECT m.id as merchant_id, m.brand_name, et.id as event_type_id, et.title, et.description, et.duration_mins, et.price FROM merchants m JOIN event_types et ON m.id = et.merchant_id WHERE m.subdomain = ? AND et.slug = ? AND et.is_active = 1",
        [subdomain, eventSlug],
        (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.length === 0) return res.status(404).json({ msg: "Event not found" });
            res.json(result[0]);
        }
    );
});

// Get merchant's base availability rules for a specific event
router.get('/public/availability/rules/:merchant_id', (req, res) => {
    const { merchant_id } = req.params;
    db.query("SELECT * FROM availability WHERE merchant_id = ?", [merchant_id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) return res.json(result);
        
        // Fallback: Default Mon-Fri 9am-5pm
        const defaults = [1, 2, 3, 4, 5].map(d => ({
            day_of_week: d,
            start_time: "09:00:00",
            end_time: "17:00:00",
            slot_duration_mins: 30
        }));
        res.json(defaults);
    });
});

// Get available slots for a specific date and event type
router.get('/public/slots', (req, res) => {
    const { merchant_id, event_type_id, date } = req.query;
    if (!merchant_id || !event_type_id || !date) return res.status(400).json({ msg: "Missing params" });
    
    const dayOfWeek = new Date(date).getDay();

    db.query(
        "SELECT * FROM availability WHERE merchant_id = ? AND day_of_week = ?",
        [merchant_id, dayOfWeek],
        (err, availData) => {
            if (err) return res.status(500).json(err);
            
            db.query(
                "SELECT duration_mins FROM event_types WHERE id = ?",
                [event_type_id],
                (err_et, etData) => {
                    if (err_et) return res.status(500).json(err_et);
                    const duration = etData[0]?.duration_mins || 30;

                    let schedules = availData;
                    if (availData.length === 0 && dayOfWeek >= 1 && dayOfWeek <= 5) {
                        schedules = [{ start_time: "09:00:00", end_time: "17:00:00" }];
                    }

                    db.query(
                        "SELECT booking_time, duration_mins FROM bookings WHERE merchant_id = ? AND booking_date = ? AND status != 'cancelled'",
                        [merchant_id, date],
                        (err_b, booked) => {
                            if (err_b) return res.status(500).json(err_b);
                            
                            // Generate slots
                            const slots = [];
                            schedules.forEach(sched => {
                                let current = new Date(`${date}T${sched.start_time}`);
                                const end = new Date(`${date}T${sched.end_time}`);
                                
                                while (current.getTime() + duration * 60000 <= end.getTime()) {
                                    const timeStr = current.toTimeString().split(' ')[0];
                                    
                                    // Check if slot overlaps with any booking
                                    const isBooked = booked.some(b => {
                                        const bStart = new Date(`${date}T${b.booking_time}`).getTime();
                                        const bEnd = bStart + b.duration_mins * 60000;
                                        const sStart = current.getTime();
                                        const sEnd = sStart + duration * 60000;
                                        return (sStart < bEnd && sEnd > bStart);
                                    });

                                    if (!isBooked) {
                                        slots.push(timeStr);
                                    }
                                    current = new Date(current.getTime() + 30 * 60000); // 30 min step
                                }
                            });

                            res.json(slots);
                        }
                    );
                }
            );
        }
    );
});

// Book an appointment (with Transaction and Lock)
router.post('/public/book', async (req, res) => {
    const { merchant_id, event_type_id, name, email, phone, date, time, notes } = req.body;
    
    // Get connection from pool for transaction
    db.getConnection((err, connection) => {
        if (err) return res.status(500).json(err);

        connection.beginTransaction(async (err_t) => {
            if (err_t) { connection.release(); return res.status(500).json(err_t); }

            try {
                // 1. Get event duration
                const [et] = await new Promise((resolve, reject) => {
                    connection.query("SELECT duration_mins FROM event_types WHERE id = ?", [event_type_id], (e, r) => e ? reject(e) : resolve(r));
                });
                const duration = et?.duration_mins || 30;

                // 2. Check for double booking with Lock
                const booked = await new Promise((resolve, reject) => {
                    connection.query(
                        "SELECT id FROM bookings WHERE merchant_id = ? AND booking_date = ? AND status != 'cancelled' AND ( (booking_time <= ? AND DATE_ADD(CONCAT(booking_date, ' ', booking_time), INTERVAL duration_mins MINUTE) > ?) OR (booking_time < DATE_ADD(CONCAT(?, ' ', ?), INTERVAL ? MINUTE) AND DATE_ADD(CONCAT(booking_date, ' ', booking_time), INTERVAL duration_mins MINUTE) >= DATE_ADD(CONCAT(?, ' ', ?), INTERVAL ? MINUTE)) ) FOR UPDATE",
                        [merchant_id, date, time, `${date} ${time}`, date, time, duration, date, time, duration],
                        (e, r) => e ? reject(e) : resolve(r)
                    );
                });

                if (booked.length > 0) {
                    throw new Error("This slot is already booked.");
                }

                // 3. Insert booking
                const result = await new Promise((resolve, reject) => {
                    connection.query(
                        "INSERT INTO bookings (merchant_id, event_type_id, customer_name, customer_email, customer_phone, booking_date, booking_time, duration_mins, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')",
                        [merchant_id, event_type_id, name, email, phone, date, time, duration, notes || ''],
                        (e, r) => e ? reject(e) : resolve(r)
                    );
                });

                connection.commit(async (err_c) => {
                    if (err_c) return connection.rollback(() => { connection.release(); res.status(500).json(err_c); });
                    connection.release();
                    res.json({ success: true, booking_id: result.insertId });
                    
                    // Trigger email notification
                    try {
                        const { sendBookingEmail } = require('../utils/email');
                        const [info] = await new Promise((resolve, reject) => {
                            db.query(
                                "SELECT m.brand_name, et.title FROM merchants m JOIN event_types et ON m.id = et.merchant_id WHERE et.id = ?",
                                [event_type_id],
                                (e, r) => e ? reject(e) : resolve(r)
                            );
                        });
                        
                        if (info) {
                            sendBookingEmail({
                                name,
                                email,
                                eventTitle: info.title,
                                date,
                                time: time.substring(0, 5),
                                brandName: info.brand_name
                            });
                        }
                    } catch (e) {
                        console.error("Email trigger failed:", e);
                    }
                });

            } catch (error) {
                connection.rollback(() => {
                    connection.release();
                    res.status(400).json({ msg: error.message });
                });
            }
        });
    });
});

// ─── PROTECTED ROUTES (for merchants) ──────────────────────

router.get('/availability', verifyMerchantToken, (req, res) => {
    db.query("SELECT * FROM availability WHERE merchant_id = ?", [req.user.merchant_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Overwrite availability (send array of all day schedules)
router.post('/availability', verifyMerchantToken, (req, res) => {
    const availability = req.body; // array of {day_of_week, start_time, end_time, slot_duration_mins}
    
    db.query("DELETE FROM availability WHERE merchant_id = ?", [req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        if (!availability || availability.length === 0) return res.json({ success: true });
        
        const values = availability.map(a => [req.user.merchant_id, a.day_of_week, a.start_time, a.end_time, a.slot_duration_mins || 30]);
        db.query("INSERT INTO availability (merchant_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES ?", [values], (err2) => {
            if (err2) return res.status(500).json(err2);
            res.json({ success: true });
        });
    });
});

router.get('/', verifyMerchantToken, (req, res) => {
    db.query(
        "SELECT b.*, et.title as event_title FROM bookings b LEFT JOIN event_types et ON b.event_type_id = et.id WHERE b.merchant_id = ? ORDER BY b.booking_date DESC, b.booking_time DESC", 
        [req.user.merchant_id], 
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

router.put('/:id/status', verifyMerchantToken, (req, res) => {
    const { status } = req.body;
    db.query("UPDATE bookings SET status = ? WHERE id = ? AND merchant_id = ?", [status, req.params.id, req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

module.exports = router;
