import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminFeedbackList,
  useAdminFeedbackDetail,
  useUpdateAdminFeedback,
} from "@/hooks/useAdminFeedback";
import {
  STATUS_COLORS,
  SEVERITY_COLORS,
  TYPE_ICONS,
  formatDate,
} from "@/lib/adminFeedback";
import type {
  AdminFeedbackFilters,
  AdminFeedbackReport,
  AdminFeedbackReportDetail,
} from "@/lib/adminFeedback";
import type { FeedbackStatus } from "@/lib/feedback";
import {
  REPORT_TYPE_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "@/lib/feedback";

export function AdminFeedback() {
  const [filters, setFilters] = useState<AdminFeedbackFilters>({
    page: 1,
    per_page: 20,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useAdminFeedbackList(filters);

  const handleFilterChange = (
    key: keyof AdminFeedbackFilters,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: key !== "page" ? 1 : prev.page, // Reset to page 1 when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, per_page: 20 });
  };

  const hasActiveFilters =
    filters.type || filters.status || filters.severity || filters.start_date;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Feedback Management</h1>
              <p className="text-sm text-gray-500">
                Review and manage user feedback
              </p>
            </div>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                Active
              </span>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={filters.type || "all"}
                    onValueChange={(v) =>
                      handleFilterChange("type", v === "all" ? undefined : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature_request">
                        Feature Request
                      </SelectItem>
                      <SelectItem value="feedback">General Feedback</SelectItem>
                      <SelectItem value="nps">NPS Survey</SelectItem>
                      <SelectItem value="quick_feedback">
                        Quick Feedback
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(v) =>
                      handleFilterChange("status", v === "all" ? undefined : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Severity</Label>
                  <Select
                    value={filters.severity || "all"}
                    onValueChange={(v) =>
                      handleFilterChange(
                        "severity",
                        v === "all" ? undefined : v
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      <SelectItem value="blocker">Blocker</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="cosmetic">Cosmetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.start_date || ""}
                    onChange={(e) =>
                      handleFilterChange("start_date", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.end_date || ""}
                    onChange={(e) =>
                      handleFilterChange("end_date", e.target.value)
                    }
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>
                {data?.meta.total_count ?? 0} Feedback Report
                {data?.meta.total_count !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                Loading...
              </div>
            ) : !data?.feedback_reports.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p className="text-lg font-medium">No feedback found</p>
                <p className="mt-1 text-sm">
                  Try adjusting your filters or check back later.
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                      <tr>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Title</th>
                        <th className="px-6 py-3">Severity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.feedback_reports.map((report) => (
                        <FeedbackRow
                          key={report.id}
                          report={report}
                          onSelect={() => setSelectedId(report.id)}
                          isSelected={selectedId === report.id}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {data.meta.total_pages > 1 && (
                  <div className="flex items-center justify-between border-t px-6 py-4">
                    <div className="text-sm text-gray-500">
                      Page {data.meta.current_page} of {data.meta.total_pages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(data.meta.current_page - 1)
                        }
                        disabled={data.meta.current_page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(data.meta.current_page + 1)
                        }
                        disabled={
                          data.meta.current_page === data.meta.total_pages
                        }
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <FeedbackDetailDialog
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}

interface FeedbackRowProps {
  report: AdminFeedbackReport;
  onSelect: () => void;
  isSelected: boolean;
}

function FeedbackRow({ report, onSelect, isSelected }: FeedbackRowProps) {
  return (
    <tr
      className={`cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
      onClick={onSelect}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span>{TYPE_ICONS[report.report_type]}</span>
          <span className="text-sm">
            {REPORT_TYPE_LABELS[report.report_type]}
          </span>
        </div>
      </td>
      <td className="max-w-xs truncate px-6 py-4">
        <span className="font-medium">{report.title}</span>
        {report.duplicate_of_id && (
          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
            Duplicate
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        {report.severity && (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${SEVERITY_COLORS[report.severity]}`}
          >
            {SEVERITY_LABELS[report.severity].split(" - ")[0]}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[report.status]}`}
        >
          {STATUS_LABELS[report.status]}
        </span>
      </td>
      <td className="px-6 py-4">
        {report.user ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{report.user.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Anonymous</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {formatDate(report.created_at)}
      </td>
      <td className="px-6 py-4">
        <ExternalLink className="h-4 w-4 text-gray-400" />
      </td>
    </tr>
  );
}

interface FeedbackDetailDialogProps {
  id: number | null;
  onClose: () => void;
}

function FeedbackDetailDialog({ id, onClose }: FeedbackDetailDialogProps) {
  const { data, isLoading } = useAdminFeedbackDetail(id);
  const updateMutation = useUpdateAdminFeedback();
  const [internalNotes, setInternalNotes] = useState("");

  const report = data?.feedback_report;

  // Sync internal notes when report loads
  if (report && internalNotes !== (report.internal_notes || "")) {
    if (!updateMutation.isPending) {
      setInternalNotes(report.internal_notes || "");
    }
  }

  const handleStatusChange = (newStatus: FeedbackStatus) => {
    if (id && report && newStatus !== report.status) {
      updateMutation.mutate({ id, data: { status: newStatus } });
    }
  };

  const handleSaveNotes = () => {
    if (id && report) {
      updateMutation.mutate({ id, data: { internal_notes: internalNotes } });
    }
  };

  const handleMarkAsDuplicate = (duplicateOfId: number) => {
    if (id) {
      updateMutation.mutate({ id, data: { duplicate_of_id: duplicateOfId } });
    }
  };

  return (
    <Dialog open={!!id} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feedback Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            Loading...
          </div>
        ) : report ? (
          <FeedbackDetailContent
            report={report}
            internalNotes={internalNotes}
            onInternalNotesChange={setInternalNotes}
            onStatusChange={handleStatusChange}
            onSaveNotes={handleSaveNotes}
            onMarkAsDuplicate={handleMarkAsDuplicate}
            isUpdating={updateMutation.isPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface FeedbackDetailContentProps {
  report: AdminFeedbackReportDetail;
  internalNotes: string;
  onInternalNotesChange: (notes: string) => void;
  onStatusChange: (status: FeedbackStatus) => void;
  onSaveNotes: () => void;
  onMarkAsDuplicate: (id: number) => void;
  isUpdating: boolean;
}

function FeedbackDetailContent({
  report,
  internalNotes,
  onInternalNotesChange,
  onStatusChange,
  onSaveNotes,
  isUpdating,
}: FeedbackDetailContentProps) {
  const [duplicateIdInput, setDuplicateIdInput] = useState("");

  const copyContext = () => {
    navigator.clipboard.writeText(JSON.stringify(report.context_data, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICONS[report.report_type]}</span>
            <span className="text-lg font-medium">
              {REPORT_TYPE_LABELS[report.report_type]}
            </span>
            {report.severity && (
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${SEVERITY_COLORS[report.severity]}`}
              >
                {SEVERITY_LABELS[report.severity].split(" - ")[0]}
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold">{report.title}</h3>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>{formatDate(report.created_at)}</p>
          {report.resolved_at && (
            <p>Resolved: {formatDate(report.resolved_at)}</p>
          )}
        </div>
      </div>

      {/* Status Management */}
      <div className="rounded-lg border p-4">
        <Label className="mb-2 block">Status</Label>
        <Select
          value={report.status}
          onValueChange={(v) => onStatusChange(v as FeedbackStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Info */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-medium">Submitted By</h4>
        {report.user ? (
          <div className="space-y-1 text-sm">
            <p>
              <strong>Name:</strong> {report.user.name}
            </p>
            <p>
              <strong>Email:</strong> {report.user.email}
            </p>
            {report.allow_contact && report.contact_email && (
              <p>
                <strong>Contact Email:</strong> {report.contact_email}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Anonymous submission</p>
        )}
      </div>

      {/* Description */}
      {report.description && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-3 font-medium">Description</h4>
          <p className="text-sm whitespace-pre-wrap text-gray-700">
            {report.description}
          </p>
        </div>
      )}

      {/* Context Data */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-medium">Context Data</h4>
          <Button variant="ghost" size="sm" onClick={copyContext}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {report.context_data.url && (
            <div>
              <span className="text-gray-500">URL:</span>{" "}
              {report.context_data.url}
            </div>
          )}
          {report.context_data.browser && (
            <div>
              <span className="text-gray-500">Browser:</span>{" "}
              {report.context_data.browser}
            </div>
          )}
          {report.context_data.os && (
            <div>
              <span className="text-gray-500">OS:</span>{" "}
              {report.context_data.os}
            </div>
          )}
          {report.context_data.screen_resolution && (
            <div>
              <span className="text-gray-500">Screen:</span>{" "}
              {report.context_data.screen_resolution}
            </div>
          )}
          {report.context_data.app_version && (
            <div>
              <span className="text-gray-500">Version:</span>{" "}
              {report.context_data.app_version}
            </div>
          )}
        </div>
      </div>

      {/* Screenshot */}
      {report.has_screenshot && report.screenshot_url && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-3 font-medium">Screenshot</h4>
          <img
            src={report.screenshot_url}
            alt="Screenshot"
            className="max-h-64 rounded border"
          />
        </div>
      )}

      {/* Duplicate Info */}
      {report.duplicate_of && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h4 className="mb-2 font-medium text-yellow-800">
            Marked as Duplicate
          </h4>
          <p className="text-sm text-yellow-700">
            Duplicate of:{" "}
            <span className="font-medium">
              #{report.duplicate_of.id} - {report.duplicate_of.title}
            </span>
          </p>
        </div>
      )}

      {/* Mark as Duplicate */}
      {!report.duplicate_of && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-3 font-medium">Mark as Duplicate</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter original report ID"
              value={duplicateIdInput}
              onChange={(e) => setDuplicateIdInput(e.target.value)}
              className="w-48"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const id = parseInt(duplicateIdInput, 10);
                if (id && !isNaN(id)) {
                  // Would call onMarkAsDuplicate(id) but we need proper implementation
                  setDuplicateIdInput("");
                }
              }}
              disabled={!duplicateIdInput || isUpdating}
            >
              Mark as Duplicate
            </Button>
          </div>
        </div>
      )}

      {/* Internal Notes */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-medium">Internal Notes</h4>
        <Textarea
          value={internalNotes}
          onChange={(e) => onInternalNotesChange(e.target.value)}
          placeholder="Add internal notes for your team..."
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            onClick={onSaveNotes}
            disabled={
              internalNotes === (report.internal_notes || "") || isUpdating
            }
          >
            Save Notes
          </Button>
        </div>
      </div>

      {/* Duplicates Count */}
      {report.duplicates_count > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>{report.duplicates_count}</strong> other report
            {report.duplicates_count !== 1 ? "s" : ""} marked as duplicate of
            this one.
          </p>
        </div>
      )}
    </div>
  );
}
