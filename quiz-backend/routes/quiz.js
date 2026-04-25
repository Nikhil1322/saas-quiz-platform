const express = require('express');
const router = express.Router();
const db = require('../db');

// PUBLIC — fetch form config (no auth needed, used by quiz renderer + embed)
router.get('/form/:id', (req, res) => {
  db.query(
    'SELECT id, name, type, config, status FROM forms WHERE id=? AND status="published"',
    [req.params.id],
    (err, r) => {
      if (err) return res.status(500).json({ msg: err.message });
      if (!r.length) return res.status(404).json({ msg: 'Form not found or not published' });
      const form = r[0];
      try { form.config = JSON.parse(form.config); } catch { form.config = {}; }
      res.json(form);
    }
  );
});

// PUBLIC — submit lead
router.post('/', (req, res) => {
  const { name, phone, result, answers, formId } = req.body;
  if (!formId) return res.status(400).json({ msg: 'formId required' });

  db.query('SELECT merchant_id FROM forms WHERE id=?', [formId], (err, formRes) => {
    if (err || !formRes.length) return res.status(404).json({ msg: 'Form not found' });
    const merchant_id = formRes[0].merchant_id;
    
    db.query(
      'INSERT INTO leads (name, phone, answers, result, form_id, merchant_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name || '', phone || '', JSON.stringify(answers || {}), result || 'completed', formId, merchant_id],
      (err2, insertRes) => {
        if (err2) return res.status(500).json({ msg: err2.message });
        res.json({ success: true });
        
        // Fire Webhook async
        db.query('SELECT webhook_url FROM merchants WHERE id=?', [merchant_id], (err3, merchRes) => {
            if (!err3 && merchRes.length && merchRes[0].webhook_url) {
                try {
                    fetch(merchRes[0].webhook_url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ event: 'new_lead', lead_id: insertRes.insertId, form_id: formId, name, phone, answers, result })
                    }).catch(e => console.error("Webhook error:", e.message));
                } catch (e) {}
            }
        });
      }
    );
  });
});

module.exports = router;