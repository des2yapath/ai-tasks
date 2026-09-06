"use client";

import { Suspense } from "react";
import { TaskList } from "@/components/tasks/task-list";

export default function InboxPage() {
  return (
    <Suspense>
      <TaskList
        title="Inbox"
        emptyHint="Your inbox is empty. Quick-add tasks above, or generate a batch from messy notes with AI."
        filter={(t) => t.parentTaskId === null && t.status === "inbox"}
      />
    </Suspense>
  );
}
