import { getStatusColors } from "../lib/statusUtils";
import React, { useState, useEffect } from "react";
import { User } from "../types";
import { getAccessLevel, hasPermission, getAdvancedPermissionScope } from '../lib/permissions';
import {
  Building2,
  Plus,
  Search,
  Calendar,
  Save,
  Trash2,
  RefreshCcw,
  AlertTriangle,
  FileCheck,
  X,
  Link as LinkIcon,
  Edit,
  Clock,
  ExternalLink,
  Printer,
} from "lucide-react";

interface SalesProductionRequestsProps {
  lang: string;
  user: User;
}

interface ProductionRequest {
  id?: string;
  requestNumber: string;
  quoteId: string;
  quotationNumber: string;
  clientName: string;
  projectName: string;
  designLink: string;
  designFileType?: "link" | "file";
  designFile?: {
    name: string;
    mimeType: string;
    data: string;
  } | null;
  completionDate: string;
  notes: string;
  status: string;
  statusUpdatedAt: string;
  createdAt: string;
  createdBy: string;
  creatorName: string;
}

export default function SalesProductionRequests({
  lang,
  user,
}: SalesProductionRequestsProps) {
  const isOwnerOrAdmin = getAccessLevel(user, 'sales', 'deleteAccess') === 'all';

  const [requests, setRequests] = useState<ProductionRequest[]>([]);
  const [approvedQuotes, setApprovedQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper for status translation
  const getTranslatedStatus = (status: string, currentLang: string) => {
    const statusTranslations: Record<string, { ar: string; en: string }> = {
      "الكل": { ar: "الكل", en: "All" },
      "في انتظار المراجعة": { ar: "في انتظار المراجعة", en: "Pending Review" },
      "قيد المراجعة": { ar: "قيد المراجعة", en: "Under Review" },
      "تم استلام الطلب": { ar: "تم استلام الطلب", en: "Request Received" },
      "قيد التنفيذ": { ar: "قيد التنفيذ", en: "In Progress" },
      "في انتظار التركيب": { ar: "في انتظار التركيب", en: "Pending Installation" },
      "في التركيب": { ar: "في التركيب", en: "In Installation" },
      "تم التركيب والتشغيل": { ar: "تم التركيب والتشغيل", en: "Installed & Operational" },
      "انتظار الدفعة الاخيرة": { ar: "انتظار الدفعة الاخيرة", en: "Awaiting Final Payment" },
      "مرفوض": { ar: "مرفوض", en: "Rejected" },
      "معلق": { ar: "معلق", en: "On Hold" },
      "تم التقييد": { ar: "تم التقييد", en: "Restricted" },
      "معتمد": { ar: "معتمد", en: "Approved" }, // This is for approved quotes, not production request status
      "تم التركيب بنجاح": { ar: "تم التركيب بنجاح", en: "Successfully Installed" }, // Added based on usage below
    };
    return statusTranslations[status]?.[currentLang] || status; // Fallback to original status if no translation found
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  // CRITICAL RULE 2: statusFilter is internal state, keeps DB value for comparison. Display logic uses getTranslatedStatus.
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dialog (Alert/Confirm)
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  // Form State
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [designLink, setDesignLink] = useState("");
  const [designFileType, setDesignFileType] = useState<"link" | "file">("link");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);

  const [editingLinkReq, setEditingLinkReq] = useState<{
    id: string;
    type: "link" | "file";
    link: string;
    file: { name: string; mimeType: string; data: string } | null;
  } | null>(null);

  const [completionDate, setCompletionDate] = useState("");
  const [notes, setNotes] = useState("");

  // Resubmission state & toast
  const [resubmitReq, setResubmitReq] = useState<any | null>(null);
  // CRITICAL RULE 2: Store internal values as Arabic, translate for display.
  const resubmitOptions = [
    "تم تعديل تفاصيل المشروع مع العميل",
    "تم تعديل وقت المشروع مع العميل",
    "تم استلام الدفعة الاولى من العميل",
    "سبب آخر",
  ];
  const [resubmitReason, setResubmitReason] = useState(resubmitOptions[0]); // Default to first Arabic option
  const [resubmitCustom, setResubmitCustom] = useState("");
  const [topToast, setTopToast] = useState<string | null>(null);

  // Status List (for filter options)
  // CRITICAL RULE 2: Keep these as Arabic for internal comparison with `statusFilter` state
  const statuses = [
    "الكل",
    "في انتظار المراجعة",
    "قيد المراجعة",
    "تم استلام الطلب",
    "قيد التنفيذ",
    "في انتظار التركيب",
    "في التركيب",
    "تم التركيب والتشغيل",
    "انتظار الدفعة الاخيرة",
    "مرفوض",
    "معلق",
    "تم التقييد",
  ];

  const showAlert = (message: string) => {
    setDialogConfig({ isOpen: true, type: "alert", message });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setDialogConfig({ isOpen: true, type: "confirm", message, onConfirm });
  };

  const closeDialog = () => setDialogConfig(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [resRequests, resQuotes] = await Promise.all([
        fetch(`/api/dynamic/sales_production_requests?t=${ts}`),
        fetch(`/api/sales_quotations?t=${ts}`),
      ]);

      if (resRequests.ok && resQuotes.ok) {
        let reqData = await resRequests.json();
        const quotesData = await resQuotes.json();

        // Ensure array
        if (!Array.isArray(reqData)) reqData = [];

        // View Filtering
        const viewScope = getAdvancedPermissionScope(user, 'sales', 'production_requests', 'view_requests');
        if (viewScope === 'own') {
          reqData = reqData.filter((r: any) => r.createdBy?.toLowerCase() === user?.username?.toLowerCase());
        } else if (viewScope === 'none') {
          reqData = [];
        }

        // CRITICAL RULE 2: Keep "معتمد" for database comparison
        setApprovedQuotes(quotesData.filter((q: any) => q.status === "معتمد"));

        setRequests(reqData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    setSelectedQuoteId("");
    setQuoteSearch("");
    setDesignLink("");
    setDesignFileType("link");
    setUploadedFile(null);
    setCompletionDate("");
    setNotes("");
    setIsModalOpen(true);
  };

  const generateRequestNumber = () => {
    const existingIds = requests.map((r) => {
      const parts = r.requestNumber?.split("-");
      if (parts && parts.length === 2 && !isNaN(Number(parts[1]))) {
        return parseInt(parts[1], 10);
      }
      return 0;
    });
    const maxNum = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `PR-${String(maxNum + 1).padStart(4, "0")}`;
  };

  const handleSaveRequest = async () => {
    if (!selectedQuoteId) return showAlert(lang === 'ar' ? "الرجاء اختيار المشروع / عرض السعر" : "Please select a Project / Quotation");
    if (designFileType === "link" && !designLink.trim()) {
      return showAlert(lang === 'ar' ? "الرجاء إضافة رابط ملف التصميم" : "Please add a design file link");
    }
    if (designFileType === "file" && !uploadedFile) {
      return showAlert(lang === 'ar' ? "الرجاء إرفاق ملف التصميم" : "Please attach the design file");
    }
    if (!completionDate)
      return showAlert(lang === 'ar' ? "الرجاء تحديد تاريخ الانتهاء المتفق عليه" : "Please specify the agreed completion date");

    const quote = approvedQuotes.find((q) => q.id === selectedQuoteId);

    const newRequest: ProductionRequest = {
      requestNumber: generateRequestNumber(),
      quoteId: selectedQuoteId,
      quotationNumber: quote?.quotationNumber || quote?.id || "---",
      clientName: quote?.clientName || "---",
      projectName: quote?.projectName || "---",
      designLink: designFileType === "link" ? designLink.trim() : "uploaded-file",
      designFileType,
      designFile: designFileType === "file" ? uploadedFile : null,
      completionDate,
      notes: notes.trim(),
      // CRITICAL RULE 2: Keep "في انتظار المراجعة" as it's a database value
      status: "في انتظار المراجعة",
      statusUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: user.username,
      creatorName: user.username,
    };

    try {
      const res = await fetch("/api/dynamic/sales_production_requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        showAlert(lang === 'ar' ? "حدث خطأ أثناء حفظ الطلب" : "An error occurred while saving the request");
      }
    } catch (e) {
      console.error(e);
      showAlert(lang === 'ar' ? "حدث خطأ أثناء حفظ الطلب" : "An error occurred while saving the request");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    try {
      const ts = Date.now();
      const matRes = await fetch(
        `/api/dynamic/material_purchase_requests?t=${ts}`,
      );
      let associatedProcId: string | null = null;
      if (matRes.ok) {
        const matReqs = await matRes.json();
        const hasMatReq = matReqs.find(
          (m: any) =>
            m.projectId === id || m.quotationNumber === req.quotationNumber,
        );
        if (hasMatReq) {
          associatedProcId = hasMatReq.id;
          if (!isOwnerOrAdmin) {
            return showAlert(
              lang === 'ar'
                ? "لقد تم طلب مواد لهذا المشروع مسبقاً، يمنع حذف الطلب نهائياً. يرجى الرجوع للإدارة."
                : "Materials have already been requested for this project. Deleting the request is strictly prohibited. Please contact administration."
            );
          }
        }
      }

      if (req.createdBy !== user.username && !isOwnerOrAdmin) {
        return showAlert(lang === 'ar' ? "فقط منشئ الطلب أو الإدارة يمكنهم إلغاء الطلب" : "Only the request creator or administration can cancel the request");
      }

      showConfirm(
        lang === 'ar'
          ? "هل أنت متأكد من إلغاء طلب الإنتاج هذا؟ سيتم أيضاً حذف أية طلبات مواد مرتبطة إن وجدت. هذا الإجراء لا يمكن التراجع عنه."
          : "Are you sure you want to cancel this production request? Any associated material requests, if any, will also be deleted. This action cannot be undone.",
        async () => {
          try {
            const res = await fetch(
              `/api/dynamic/sales_production_requests/${id}`,
              {
                method: "DELETE",
              },
            );
            if (res.ok) {
              if (associatedProcId) {
                await fetch(
                  `/api/dynamic/material_purchase_requests/${associatedProcId}`,
                  { method: "DELETE" },
                );
              }
              fetchData();
              setTopToast(lang === 'ar' ? "تم إلغاء وحذف الطلب بنجاح" : "Request cancelled and deleted successfully");
              setTimeout(() => setTopToast(null), 3000);
            } else {
              showAlert(lang === 'ar' ? "حدث خطأ أثناء الإلغاء" : "An error occurred during cancellation");
            }
          } catch (e) {
            console.error(e);
            showAlert(lang === 'ar' ? "حدث خطأ أثناء الإلغاء" : "An error occurred during cancellation");
          }
        },
      );
    } catch (e) {
      console.error(e);
      showAlert(lang === 'ar' ? "حدث خطأ أثناء فحص البيانات للمشروع" : "An error occurred while checking project data");
    }
  };

  const updateDesignFileAndLink = async (reqId: string, type: "link" | "file", link: string, file: any) => {
    if (type === "link" && !link.trim()) return showAlert(lang === 'ar' ? "الرابط لا يمكن أن يكون فارغاً" : "The link cannot be empty");
    if (type === "file" && !file) return showAlert(lang === 'ar' ? "الرجاء رفع الملف" : "Please upload the file");
    try {
      const res = await fetch(
        `/api/dynamic/sales_production_requests/${reqId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            designFileType: type,
            designLink: type === "link" ? link.trim() : "uploaded-file",
            designFile: type === "file" ? file : null,
          }),
        },
      );
      if (res.ok) {
        fetchData();
        setTopToast(lang === 'ar' ? "تم تحديث ملف التصميم بنجاح" : "Design file updated successfully");
        setTimeout(() => setTopToast(null), 3000);
      } else {
        showAlert(lang === 'ar' ? "حدث خطأ أثناء التحديث" : "An error occurred during the update");
      }
    } catch (e) {
      console.error(e);
      showAlert(lang === 'ar' ? "حدث خطأ أثناء التحديث" : "An error occurred during the update");
    }
  };

  const handlePrintFile = (file: { name: string; mimeType: string; data: string }) => {
    // CRITICAL RULE 3: showAlert message translation
    const printWindow = window.open("", "_blank");
    if (!printWindow) return showAlert(lang === 'ar' ? "الرجاء السماح بالنوافذ المنبثقة للطباعة" : "Please allow pop-up windows for printing");
    
    if (file.mimeType.startsWith("image/")) {
      printWindow.document.write(`
        <html>
          <head>
          <style>
            @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            * { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
            <title>${lang === 'ar' ? "طباعة ملف التصميم" : "Print Design File"} - ${file.name}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
              @media print {
                img { max-width: 100%; max-height: 100%; }
              }
            </style>
          </head>
          <body>
            <img src="${file.data}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else if (file.mimeType === "application/pdf") {
      printWindow.document.write(`
        <html>
          <head>
          <style>
            @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            * { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
            <title>${lang === 'ar' ? "طباعة ملف التصميم" : "Print Design File"} - ${file.name}</title>
            <style>
              body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
              iframe { border: none; width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            <iframe src="${file.data}" onload="setTimeout(function() { window.print(); }, 1000);"></iframe>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleResubmitRequest = async () => {
    if (!resubmitReq) return;
    // CRITICAL RULE 2: Keep internal comparisons and values as Arabic.
    const finalReason =
      resubmitReason === "سبب آخر" ? resubmitCustom : resubmitReason;
    if (resubmitReason === "سبب آخر" && !resubmitCustom.trim()) {
      showAlert(lang === 'ar' ? "الرجاء كتابة سبب إعادة طلب الإنتاج المخصص." : "Please write the custom reason for resubmitting the production request.");
      return;
    }

    try {
      const res = await fetch(
        `/api/dynamic/sales_production_requests/${resubmitReq.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // CRITICAL RULE 2: Keep database value for status
            status: "في انتظار المراجعة",
            holdReason: "",
            resubmitReason: finalReason,
            resubmittedBy: user.username,
            resubmittedAt: new Date().toISOString(),
            statusUpdatedAt: new Date().toISOString(),
          }),
        },
      );
      if (res.ok) {
        setTopToast(lang === 'ar' ? "تم ارسال اعادة طلب بنجاح" : "Resubmission request sent successfully");
        setTimeout(() => setTopToast(null), 3000);
        setResubmitReq(null);
        fetchData();
      } else {
        showAlert(lang === 'ar' ? "خطأ أثناء تقديم إعادة الطلب" : "Error while submitting resubmission request");
      }
    } catch (e) {
      console.error(e);
      showAlert(lang === 'ar' ? "حدث كشاف خطأ فني أثناء التعديل" : "A technical error occurred during the modification");
    }
  };

  const filteredRequests = requests
    .filter((r) => {
      // CRITICAL RULE 2: Keep "الكل" comparison as it's an internal filter state
      if (statusFilter !== "الكل" && r.status !== statusFilter) return false;

      if (searchQuery) {
        const t = searchQuery.toLowerCase();
        if (
          !(r.requestNumber || '').toLowerCase().includes(t) &&
          !(r.projectName || '').toLowerCase().includes(t) &&
          !(r.quotationNumber || '').toLowerCase().includes(t)
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const d1 = new Date(a.createdAt).getTime();
      const d2 = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? d2 - d1 : d1 - d2;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}> {/* Made dir dynamic */}
      {topToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-sm px-4">
          <div className="bg-emerald-600 text-white rounded-2xl shadow-xl p-4 text-center font-bold text-xs">
            🎉 {topToast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" />
            {lang === 'ar' ? "طلبات الإنتاج المرسلة" : "Submitted Production Requests"}
          </h1>
          <p className="text-slate-500 mt-2">
            {lang === 'ar' ? "إدارة ومتابعة طلبات الإنتاج الموجهة لقسم الإنتاج وتتبع حالاتها." : "Manage and track production requests directed to the production department."}
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {lang === 'ar' ? "إنشاء طلب إنتاج" : "Create Production Request"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
          <input
            type="text"
            placeholder={lang === 'ar' ? "البحث برقم الطلب، المشروع، العرض..." : "Search by Request No., Project, Quotation..."}
            className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {getTranslatedStatus(s, lang)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
          >
            <option value="newest">{lang === 'ar' ? "الأحدث أولاً" : "Newest First"}</option>
            <option value="oldest">{lang === 'ar' ? "الأقدم أولاً" : "Oldest First"}</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req: any) => (
          <div
            key={req.id}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-shadow relative"
          >
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-sm font-black text-indigo-700">
                  {req.creatorName?.[0] || "U"}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    {lang === 'ar' ? "بواسطة" : "By"}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {req.creatorName}
                  </span>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusColors(req.status)}`}
              >
                {getTranslatedStatus(req.status, lang)}
              </div>
            </div>

            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 mb-1 block">
                {lang === 'ar' ? "رقم الطلب" : "Request Number"}
              </span>
              <span className="text-lg font-black text-indigo-700">
                {req.requestNumber}
              </span>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-400" />
                <span
                  className="text-sm font-bold text-slate-700 truncate"
                  title={req.projectName}
                >
                  {lang === 'ar' ? "المشروع:" : "Project:"} {req.projectName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {lang === 'ar' ? "العرض:" : "Quotation:"} {req.quotationNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {lang === 'ar' ? "تاريخ الانتهاء:" : "Completion Date:"}{" "}
                  <span className="font-bold">{req.completionDate}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">
                  {lang === 'ar' ? "آخر تحديث:" : "Last Updated:"}{" "}
                  {new Date(req.statusUpdatedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>

              {/* Link Input / Button */}
              <div className="p-3 bg-slate-50 rounded-xl mt-4 border border-slate-100">
                <label className="text-xs font-bold text-slate-500 mb-2 block">
                  {lang === 'ar' ? "ملف التصميم:" : "Design File:"}
                </label>
                {req.designFileType === "file" && req.designFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                      <FileCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{req.designFile.name}</p>
                        <p className="text-[10px] text-slate-400">{req.designFile.mimeType}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPreviewFile(req.designFile!)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> {lang === 'ar' ? "عرض ومعاينة" : "View & Preview"}
                      </button>
                      <button
                        onClick={() => handlePrintFile(req.designFile!)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg flex-shrink-0 transition"
                        title={lang === 'ar' ? "طباعة" : "Print"}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {(user.username === req.createdBy || isOwnerOrAdmin) && (
                        <button
                          onClick={() =>
                            setEditingLinkReq({
                              id: req.id!,
                              type: "file",
                              link: "",
                              file: req.designFile || null
                            })
                          }
                          className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex-shrink-0 transition"
                          title={lang === 'ar' ? "تعديل الملف" : "Edit File"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <a
                      href={req.designLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition truncate text-center"
                    >
                      <ExternalLink className="w-4 h-4" /> {lang === 'ar' ? "عرض ملف التصميم" : "View Design File"}
                    </a>
                    {(user.username === req.createdBy || isOwnerOrAdmin) && (
                      <button
                        onClick={() =>
                          setEditingLinkReq({
                            id: req.id!,
                            type: req.designFileType || "link",
                            link: req.designLink,
                            file: null
                          })
                        }
                        className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex-shrink-0 transition"
                        title={lang === 'ar' ? "تعديل الرابط" : "Edit Link"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {req.notes && (
                <div className="mt-4 text-sm text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-800 block mb-1">
                    {lang === 'ar' ? "ملاحظات:" : "Notes:"}
                  </span>
                  {req.notes}
                </div>
              )}

              {/* CRITICAL RULE 2: Keep 'تم التقييد' for comparison */}
              {req.status === "تم التقييد" && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-155 rounded-2xl space-y-2">
                  <p className="text-xs text-rose-800 font-black">
                    ⚠️ {lang === 'ar' ? "تم تقييد الطلب من قاعة الإنتاج:" : "Request has been restricted by Production Floor:"}
                  </p>
                  <p className="text-xs text-rose-950 font-extrabold">
                    {req.holdReason || (lang === 'ar' ? "غير محدد" : "Not specified")}
                  </p>
                  {req.heldBy && (
                    <p className="text-[10px] text-slate-400">
                      {lang === 'ar' ? "بواسطة" : "By"} {req.heldBy} {lang === 'ar' ? "في" : "on"}{" "}
                      {req.heldAt
                        ? new Date(req.heldAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')
                        : ""}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setResubmitReq(req);
                      // CRITICAL RULE 2: Set internal state to Arabic
                      setResubmitReason(resubmitOptions[0]);
                      setResubmitCustom("");
                    }}
                    className="mt-2.5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    🔄 {lang === 'ar' ? "إعادة إرسال طلب إنتاج" : "Resubmit Production Request"}
                  </button>
                </div>
              )}

              {/* CRITICAL RULE 2: Keep 'تم التركيب بنجاح' for comparison */}
              {req.status === "تم التركيب بنجاح" && req.confirmedBy && (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-150 rounded-2xl space-y-2">
                  <span className="flex items-center gap-2 text-xs text-emerald-800 font-black">
                    ✅ {lang === 'ar' ? "تم تأكيد اكتمال المشروع والتركيب بنجاح" : "Project completion and installation successfully confirmed"}
                  </span>
                  <p className="text-[11px] text-slate-500 font-extrabold">
                    {lang === 'ar' ? "تم تأكيده بواسطة" : "Confirmed by"} {req.confirmedBy} {lang === 'ar' ? "في" : "on"}{" "}
                    {req.completedAt
                      ? new Date(req.completedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')
                      : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end items-center">
              {(user.username === req.createdBy || isOwnerOrAdmin) && (
                <button
                  onClick={() => handleDeleteRequest(req.id!)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                  title={lang === 'ar' ? "إلغاء الطلب" : "Cancel Request"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500 font-bold">
            {lang === 'ar' ? "لا توجد طلبات إنتاج تطابق بحثك." : "No production requests match your search."}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-20 pb-24">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-40 rounded-t-3xl">
              <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                <Plus className="w-6 h-6" /> {lang === 'ar' ? "إنشاء طلب إنتاج جديد" : "Create New Production Request"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {lang === 'ar' ? "اختيار المشروع / عرض السعر" : "Select Project / Quotation"}
                </label>
                <div className="relative group/quote z-30" tabIndex={0}>
                  <div className="w-full p-4 border rounded-xl font-bold bg-slate-50 focus-within:bg-white focus-within:border-indigo-500 flex justify-between items-center cursor-pointer">
                    <span className="truncate">
                      {selectedQuoteId
                        ? (() => {
                            const q = approvedQuotes.find(
                              (x) => x.id === selectedQuoteId,
                            );
                            return q
                              ? `${q.quotationNumber} - ${q.projectName || q.clientName}`
                              : (lang === 'ar' ? "اختر المشروع" : "Select Project");
                          })()
                        : (lang === 'ar' ? "-- اختر المشروع --" : "-- Select Project --")}
                    </span>
                  </div>

                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-focus-within/quote:block hover:block z-40 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? "البحث باسم المشروع أو الكوتيشن..." : "Search by project name or quotation..."}
                      value={quoteSearch}
                      onChange={(e) => setQuoteSearch(e.target.value)}
                      className="w-full p-2 mb-2 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 text-sm sticky top-0"
                    />

                    <div className="flex flex-col gap-1">
                      {approvedQuotes
                        .filter((q) => {
                          if (!quoteSearch) return true;
                          const term = quoteSearch.toLowerCase();
                          return (
                            q.quotationNumber?.toLowerCase().includes(term) ||
                            (q.projectName &&
                              (q.projectName || '').toLowerCase().includes(term)) ||
                            (q.clientName &&
                              (q.clientName || '').toLowerCase().includes(term))
                          );
                        })
                        .map((q) => (
                          <div
                            key={q.id}
                            onClick={() => {
                              setSelectedQuoteId(q.id);
                              if (
                                document.activeElement instanceof HTMLElement
                              ) {
                                document.activeElement.blur();
                              }
                            }}
                            className={`p-3 rounded-xl cursor-pointer text-sm font-bold transition hover:bg-slate-50 ${selectedQuoteId === q.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                          >
                            {q.quotationNumber} -{" "}
                            {q.projectName || q.clientName}
                          </div>
                        ))}
                      {approvedQuotes.length > 0 &&
                        approvedQuotes.filter((q) => {
                          if (!quoteSearch) return true;
                          const term = quoteSearch.toLowerCase();
                          return (
                            q.quotationNumber?.toLowerCase().includes(term) ||
                            (q.projectName &&
                              (q.projectName || '').toLowerCase().includes(term)) ||
                            (q.clientName &&
                              (q.clientName || '').toLowerCase().includes(term))
                          );
                        }).length === 0 && (
                          <div className="p-3 text-center text-sm text-slate-500 font-bold">
                            {lang === 'ar' ? "لا توجد نتائج" : "No results found"}
                          </div>
                        )}
                      {approvedQuotes.length === 0 && (
                        <div className="p-3 text-center text-sm text-slate-500 font-bold">
                          {lang === 'ar' ? "لا توجد عروض أسعار متاحة" : "No quotations available"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Link / File Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {lang === 'ar' ? "طريقة إرفاق ملف التصميم" : "Design File Attachment Method"}
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setDesignFileType("link")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${designFileType === "link" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {lang === 'ar' ? "رابط خارجي" : "External Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesignFileType("file")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${designFileType === "file" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {lang === 'ar' ? "رفع ملف (صورة / PDF)" : "Upload File (Image / PDF)"}
                  </button>
                </div>

                {designFileType === "link" ? (
                  <div className="relative">
                    <LinkIcon className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={designLink}
                      onChange={(e) => setDesignLink(e.target.value)}
                      className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-left`}
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100/50 transition relative flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setUploadedFile({
                              name: file.name,
                              mimeType: file.type,
                              data: reader.result as string,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileCheck className="w-10 h-10 text-indigo-500 mb-2" />
                    <p className="text-xs font-bold text-slate-700 mb-1">
                      {uploadedFile ? `${lang === 'ar' ? "تم اختيار:" : "Selected:"} ${uploadedFile.name}` : (lang === 'ar' ? "اسحب ملف التصميم هنا أو انقر للتصفح" : "Drag design file here or click to browse")}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'ar' ? "صورة (PNG, JPG) أو ملف PDF" : "Image (PNG, JPG) or PDF file"}
                    </p>
                  </div>
                )}
              </div>

              {/* Completion Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {lang === 'ar' ? "تاريخ الانتهاء المتفق عليه مع العميل" : "Agreed Completion Date with Client"}
                </label>
                <div className="relative">
                  <Calendar className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {lang === 'ar' ? "ملاحظات لقسم الإنتاج (اختياري)" : "Notes for Production Department (Optional)"}
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ar' ? "أدخل أي ملاحظات إضافية..." : "Enter any additional notes..."}
                  className="w-full p-4 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                {lang === 'ar' ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSaveRequest}
                className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                <Save className="w-5 h-5" />
                {lang === 'ar' ? "إرسال طلب إنتاج" : "Submit Production Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      {dialogConfig?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
            {dialogConfig.type === "confirm" ? (
              <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-indigo-500 mb-4" />
            )}
            <p className="text-slate-800 text-lg font-bold mb-6">
              {dialogConfig.message}
            </p>
            <div className="flex gap-3 w-full">
              {dialogConfig.type === "confirm" && (
                <button
                  onClick={closeDialog}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  {lang === 'ar' ? "إلغاء" : "Cancel"}
                </button>
              )}
              <button
                onClick={() => {
                  dialogConfig.onConfirm?.();
                  closeDialog();
                }}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition ${dialogConfig.type === "confirm" ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {dialogConfig.type === "confirm" ? (lang === 'ar' ? "موافق، احذف" : "Confirm, Delete") : (lang === 'ar' ? "حسناً" : "Okay")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Link / File Modal */}
      {editingLinkReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col text-right">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {lang === 'ar' ? "تعديل ملف التصميم" : "Edit Design File"}
            </h3>

            {/* Toggle in edit */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
              <button
                type="button"
                onClick={() => setEditingLinkReq({ ...editingLinkReq, type: "link" })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${editingLinkReq.type === "link" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {lang === 'ar' ? "رابط خارجي" : "External Link"}
              </button>
              <button
                type="button"
                onClick={() => setEditingLinkReq({ ...editingLinkReq, type: "file" })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${editingLinkReq.type === "file" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {lang === 'ar' ? "رفع ملف (صورة / PDF)" : "Upload File (Image / PDF)"}
              </button>
            </div>

            {editingLinkReq.type === "link" ? (
              <input
                type="url"
                value={editingLinkReq.link}
                onChange={(e) =>
                  setEditingLinkReq({ ...editingLinkReq, link: e.target.value })
                }
                className={`w-full p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 ${lang === 'ar' ? 'text-right' : 'text-left'} mb-6`}
                dir="ltr"
                placeholder="https://..."
              />
            ) : (
              <div className="mb-6">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setEditingLinkReq({
                          ...editingLinkReq,
                          file: {
                            name: f.name,
                            mimeType: f.type,
                            data: reader.result as string
                          }
                        });
                      };
                      reader.readAsDataURL(f);
                    }
                  }}
                  className="w-full text-xs font-bold text-slate-500 file:ml-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {editingLinkReq.file && (
                  <p className="mt-2 text-xs text-indigo-600 font-bold">
                    {lang === 'ar' ? "تم اختيار:" : "Selected:"} {editingLinkReq.file.name}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingLinkReq(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                {lang === 'ar' ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  updateDesignFileAndLink(
                    editingLinkReq.id,
                    editingLinkReq.type,
                    editingLinkReq.link,
                    editingLinkReq.file
                  );
                  setEditingLinkReq(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {lang === 'ar' ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmission Modal (Requirement) */}
      {resubmitReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col text-right"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-1.5">
              🔄{" "}
              {lang === "ar"
                ? "إعادة إرسال طلب الإنتاج"
                : "Resubmit Production Request"}
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              {lang === 'ar'
                ? "يرجى من فضلك اختيار المبرر أو الإجراء المصحح الذي تم اتخاذه للتجاوز:"
                : "Please select the justification or corrective action taken to proceed:"}
            </p>

            <div className="space-y-3 mb-6 text-xs text-slate-600 font-bold">
              {[
                { ar: "تم تعديل تفاصيل المشروع مع العميل", en: "Project details have been modified with the client" },
                { ar: "تم تعديل وقت المشروع مع العميل", en: "Project timeline has been modified with the client" },
                { ar: "تم استلام الدفعة الاولى من العميل", en: "First payment has been received from the client" },
                { ar: "سبب آخر", en: "Other reason" },
              ].map((opt) => (
                <label
                  key={opt.ar}
                  className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 border rounded-xl cursor-pointer"
                >
                  <input
                    type="radio"
                    name="resubmit_opt"
                    value={opt.ar} // CRITICAL RULE 2: Store Arabic in state
                    checked={resubmitReason === opt.ar} // CRITICAL RULE 2: Compare with Arabic state
                    onChange={(e) => setResubmitReason(e.target.value)}
                  />
                  <span>{lang === 'ar' ? opt.ar : opt.en}</span>
                </label>
              ))}

              {resubmitReason === "سبب آخر" && ( // CRITICAL RULE 2: Compare with Arabic state
                <textarea
                  value={resubmitCustom}
                  onChange={(e) => setResubmitCustom(e.target.value)}
                  placeholder={lang === 'ar' ? "اكتب تفاصيل سبب إعادة التقديم هنا..." : "Write details of the resubmission reason here..."}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold outline-none focus:bg-white"
                />
              )}
            </div>

            <div className="flex gap-2.5 justify-end border-t pt-3.5">
              <button
                onClick={() => setResubmitReq(null)}
                className="px-4 py-2 bg-slate-100 text-slate-650 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                {lang === 'ar' ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleResubmitRequest}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-100"
              >
                🚀 {lang === 'ar' ? "إرسال التحديث للإنتاج" : "Send Update to Production"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Selected Design File Preview Modal */}
      {selectedPreviewFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl h-[85vh] shadow-2xl flex flex-col text-right">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                {lang === 'ar' ? "معاينة ملف التصميم:" : "Preview Design File:"} {selectedPreviewFile.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintFile(selectedPreviewFile)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> {lang === 'ar' ? "طباعة" : "Print"}
                </button>
                <button
                  onClick={() => setSelectedPreviewFile(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 rounded-2xl p-4 my-4 flex items-center justify-center">
              {selectedPreviewFile.mimeType.startsWith("image/") ? (
                <img
                  src={selectedPreviewFile.data}
                  alt={selectedPreviewFile.name}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                />
              ) : selectedPreviewFile.mimeType === "application/pdf" ? (
                <iframe
                  src={selectedPreviewFile.data}
                  title={selectedPreviewFile.name}
                  className="w-full h-full border-0 rounded-xl bg-white"
                />
              ) : (
                <div className="text-center text-slate-500 font-bold p-12">
                  <p className="mb-2">{lang === 'ar' ? "لا يمكن عرض هذا الملف مباشرة" : "This file cannot be displayed directly"}</p>
                  <p className="text-xs text-slate-400">{lang === 'ar' ? "يرجى تنزيله أو استخدام خيار الطباعة" : "Please download it or use the print option"}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedPreviewFile(null)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition text-sm"
              >
                {lang === 'ar' ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}