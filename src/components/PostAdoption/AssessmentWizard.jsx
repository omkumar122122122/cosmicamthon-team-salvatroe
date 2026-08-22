import AIInterviewCall from "./AIInterviewCall";

export default function AssessmentWizard({ childId, scheduleId, childName, onFinish, onCancel }) {
  return (
    <AIInterviewCall
      childId={childId}
      scheduleId={scheduleId}
      childName={childName}
      onFinish={onFinish}
      onCancel={onCancel}
    />
  );
}
