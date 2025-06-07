// app/admin/exams/[examId]/page.tsx

import ExamReviewClient from "./ExamReviewClient";

export default async function ExamReviewPage({ params }: { params: Promise<{ examId: string }> }) {
  const param = await params;
  return <ExamReviewClient examId={param.examId} />;
}
