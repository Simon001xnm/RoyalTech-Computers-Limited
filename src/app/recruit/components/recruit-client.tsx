
"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JobPostingList } from "./job-posting-list";
import { ApplicantList } from "./applicant-list";

export function RecruitClient() {
  return (
    <>
      <PageHeader 
        title="Recruitment" 
        description="Manage job postings, applications, candidates, and hiring workflows."
      />

      <div className="space-y-6">
        <JobPostingList />
        <ApplicantList />
      </div>
    </>
  );
}
