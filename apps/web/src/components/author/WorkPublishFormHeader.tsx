import { WORK_PUBLISH_FORM_GUIDANCE } from "@/lib/works/work-publish-form-guidance";

export function WorkPublishFormHeader() {
  return (
    <div>
      <h1 id="publish-work-title" className="text-2xl font-semibold text-white">
        Publish a work
      </h1>
      <p className="mt-1 text-sm text-white/60">{WORK_PUBLISH_FORM_GUIDANCE.intro}</p>
      <p className="mt-2 text-xs text-white/50">
        Fields marked with <span className="text-red-400">*</span> are required.
      </p>
    </div>
  );
}
