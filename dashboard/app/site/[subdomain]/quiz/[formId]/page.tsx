import QuizRenderer from "@/app/quiz/[formId]/page";

// This simply renders the existing quiz component but works 
// under the dynamic /site/[subdomain] route that the middleware redirects to.
export default function SubdomainQuizPage() {
  return <QuizRenderer />;
}
