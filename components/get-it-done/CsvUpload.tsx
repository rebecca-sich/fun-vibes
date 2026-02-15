"use client";

import { useState, useRef } from "react";

interface CsvUploadProps {
  slug: string;
  onStatusChange: (status: "idle" | "uploading" | "success" | "error") => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  successCount: number | null;
  errors: ValidationError[] | null;
  generalError: string | null;
}

function downloadTemplate() {
  const template = [
    "title,date,time,notes,repeat,repeat_interval,repeat_days,repeat_end,reminder,reminder_minutes",
    "Take vitamins,2026-03-01,08:00,,daily,1,,,yes,0",
    '"Team meeting",2026-03-03,10:00,Weekly sync,weekly,1,"Mon,Wed,Fri",,no,',
  ].join("\n");

  const blob = new Blob([template], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "task-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvUpload({ slug, onStatusChange }: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    status: "idle",
    successCount: null,
    errors: null,
    generalError: null,
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setState({
      status: "uploading",
      successCount: null,
      errors: null,
      generalError: null,
    });
    onStatusChange("uploading");

    try {
      const text = await file.text();

      const res = await fetch(
        `/get-it-done/api/tasks/bulk?slug=${encodeURIComponent(slug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/csv" },
          body: text,
        }
      );

      const data = await res.json();

      if (res.ok) {
        setState({
          status: "success",
          successCount: data.created,
          errors: null,
          generalError: null,
        });
        onStatusChange("success");
      } else if (data.errors) {
        setState({
          status: "error",
          successCount: null,
          errors: data.errors,
          generalError: null,
        });
        onStatusChange("error");
      } else {
        setState({
          status: "error",
          successCount: null,
          errors: null,
          generalError: data.error || "Upload failed",
        });
        onStatusChange("error");
      }
    } catch {
      setState({
        status: "error",
        successCount: null,
        errors: null,
        generalError:
          "Upload failed. Please check your connection and try again.",
      });
      onStatusChange("error");
    }
  }

  function dismiss() {
    setState({
      status: "idle",
      successCount: null,
      errors: null,
      generalError: null,
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white p-5 text-center space-y-3">
        <p className="text-sm text-[#6B7280]">Import tasks from a CSV file</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Choose CSV file to upload"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={state.status === "uploading"}
          className="rounded-xl border-2 border-[#2563EB] px-6 py-3 text-base font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[50px] disabled:opacity-40"
        >
          {state.status === "uploading" ? "Uploading..." : "Choose CSV File"}
        </button>

        <button
          type="button"
          onClick={downloadTemplate}
          className="block mx-auto text-sm font-medium text-[#2563EB] underline"
        >
          Download CSV template
        </button>
      </div>

      {/* Success message */}
      {state.status === "success" && state.successCount !== null && (
        <div
          role="alert"
          className="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3"
        >
          <p className="text-sm font-medium text-[#166534]">
            Successfully imported {state.successCount} task
            {state.successCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Validation errors */}
      {state.status === "error" && state.errors && state.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border-2 border-[#DC4F4F] bg-[#FEF2F2] p-4 space-y-2"
        >
          <p className="text-sm font-bold text-[#DC4F4F]">
            Upload failed &mdash; {state.errors.length} error
            {state.errors.length !== 1 ? "s" : ""} found:
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {state.errors.map((err, i) => (
              <p key={i} className="text-sm text-[#DC4F4F]">
                {err.row > 0
                  ? `Row ${err.row}, ${err.field}: ${err.message}`
                  : err.message}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-semibold text-[#DC4F4F] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* General error */}
      {state.status === "error" && state.generalError && (
        <div role="alert" className="rounded-xl border-2 border-[#DC4F4F] bg-[#FEF2F2] px-4 py-3">
          <p className="text-sm font-medium text-[#DC4F4F]">
            {state.generalError}
          </p>
        </div>
      )}
    </div>
  );
}
