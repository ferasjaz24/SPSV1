import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Shield, Users, Briefcase, Settings, Package, Box, LayoutDashboard, Copy, 
  History, Save, X, Lock, Unlock, AlertTriangle, FileText, CheckCircle, DollarSign
} from 'lucide-react';

// Define the exact sub-sections and their unique permissions mentioned by the user
const PERMISSIONS_SCHEMA = {
  dashboard: {
    ar: 'لوحة المؤشرات', en: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5"/>,
    sub: {
      metrics: {
        ar: 'مؤشرات النظام الرئيسية', en: 'Key System Metrics',
        perms: [
          { id: 'view_main', labelAr: 'عرض لوحة المؤشرات الرئيسية', labelEn: 'View Main Dashboard Metrics', type: 'view' },
          { id: 'view_hr', labelAr: 'عرض مؤشرات الموارد البشرية', labelEn: 'View HR Metrics', type: 'view' },
          { id: 'view_sales', labelAr: 'عرض مؤشرات المبيعات والتحصيل', labelEn: 'View Sales & Collection Metrics', type: 'view' },
          { id: 'view_procurement', labelAr: 'عرض مؤشرات المشتريات والمستودع', labelEn: 'View Procurement & Inventory Metrics', type: 'view' },
          { id: 'view_production', labelAr: 'عرض مؤشرات الإنتاج', labelEn: 'View Production Metrics', type: 'view' },
          { id: 'view_alerts', labelAr: 'عرض التنبيهات الحرجة', labelEn: 'View Critical Alerts', type: 'sensitive' },
          { id: 'view_logs', labelAr: 'عرض آخر العمليات', labelEn: 'View Recent Activities Log', type: 'view' },
          { id: 'filter_date', labelAr: 'استخدام فلتر الشهر والسنة', labelEn: 'Apply Month & Year Filter', type: 'edit' },
          { id: 'view_financial', labelAr: 'عرض الأرقام المالية', labelEn: 'View Financial Figures', type: 'financial' },
          { id: 'view_payroll', labelAr: 'عرض مؤشرات الرواتب', labelEn: 'View Payroll Metrics', type: 'financial' },
          { id: 'view_inventory', labelAr: 'عرض مؤشرات المخزون', labelEn: 'View Inventory Metrics', type: 'view' },
          { id: 'export_metrics', labelAr: 'تصدير ملخص لوحة المؤشرات', labelEn: 'Export Dashboard Summary', type: 'export' }
        ]
      },
      quick_shortcuts: {
        ar: 'الاختصارات السريعة للعمليات', en: 'Operational Quick Shortcuts',
        perms: [
          { id: 'view_main_shortcuts', labelAr: 'عرض واستخدام الاختصارات السريعة في لوحة المؤشرات الرئيسية', labelEn: 'View & Use Main Dashboard Quick Shortcuts', type: 'view' },
          { id: 'view_procurement_shortcuts', labelAr: 'عرض واستخدام الاختصارات السريعة في لوحة المشتريات والمستودع', labelEn: 'View & Use Procurement & Inventory Dashboard Quick Shortcuts', type: 'view' },
          { id: 'view_production_shortcuts', labelAr: 'عرض واستخدام الاختصارات السريعة في لوحة التحكم بالإنتاج', labelEn: 'View & Use Production Control Panel Quick Shortcuts', type: 'view' }
        ]
      }
    }
  },
  hr: {
    ar: 'الموارد البشرية', en: 'Human Resources',
    icon: <Users className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات', en: 'HR Dashboard & Metrics',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة الموارد البشرية', labelEn: 'View HR Dashboard', type: 'view' },
          { id: 'view_total_emp', labelAr: 'عرض إجمالي الموظفين', labelEn: 'View Total Employees', type: 'view' },
          { id: 'view_active_emp', labelAr: 'عرض الموظفين النشطين', labelEn: 'View Active Employees', type: 'view' },
          { id: 'view_leave_emp', labelAr: 'عرض الموظفين في إجازة', labelEn: 'View Employees on Leave', type: 'view' },
          { id: 'view_attendance', labelAr: 'عرض الحضور والغياب', labelEn: 'View Attendance & Absences', type: 'view' },
          { id: 'view_total_salaries', labelAr: 'عرض إجمالي الرواتب الشهرية', labelEn: 'View Total Monthly Salaries', type: 'financial' },
          { id: 'view_total_deductions', labelAr: 'عرض إجمالي الخصومات', labelEn: 'View Total Deductions', type: 'financial' },
          { id: 'view_total_loans', labelAr: 'عرض إجمالي السلف', labelEn: 'View Total Loans/Advances', type: 'financial' },
          { id: 'view_expiries', labelAr: 'عرض العقود والإقامات القريبة من الانتهاء', labelEn: 'View Expiring Contracts & Residences', type: 'view' }
        ]
      },
      self_service: {
        ar: 'الخدمة الذاتية والاستعلامات', en: 'Self-Service & Inquiries',
        perms: [
          { id: 'view_inquiries', labelAr: 'عرض استعلامات الموظفين', labelEn: 'View Employee Inquiries', type: 'view' },
          { id: 'reply_inquiry', labelAr: 'الرد على استعلام موظف', labelEn: 'Reply to Employee Inquiry', type: 'edit' },
          { id: 'close_inquiry', labelAr: 'إغلاق استعلام', labelEn: 'Close Inquiry', type: 'edit' },
          { id: 'forward_inquiry', labelAr: 'تحويل استعلام', labelEn: 'Forward Inquiry', type: 'edit' },
          { id: 'delete_inquiry', labelAr: 'حذف استعلام', labelEn: 'Delete Inquiry', type: 'delete' },
          { id: 'view_attachments', labelAr: 'عرض/تحميل مرفقات الاستعلام', labelEn: 'View/Download Inquiry Attachments', type: 'view' },
          { id: 'print_inquiry', labelAr: 'طباعة/تصدير الاستعلام', labelEn: 'Print/Export Inquiry', type: 'export' }
        ]
      },
      employees: {
        ar: 'بيانات الموظفين', en: 'Employee Data',
        perms: [
          { id: 'view_emp', labelAr: 'عرض قائمة الموظفين', labelEn: 'View Employee List', type: 'view' },
          { id: 'add_emp', labelAr: 'إضافة موظف جديد', labelEn: 'Add New Employee', type: 'add' },
          { id: 'edit_emp', labelAr: 'تعديل بيانات الموظف', labelEn: 'Edit Employee Data', type: 'edit' },
          { id: 'delete_emp', labelAr: 'حذف موظف', labelEn: 'Delete Employee', type: 'delete' },
          { id: 'disable_emp', labelAr: 'تعطيل / تفعيل موظف', labelEn: 'Deactivate / Reactivate Employee', type: 'sensitive' },
          { id: 'view_salary', labelAr: 'عرض بيانات الراتب', labelEn: 'View Salary Data', type: 'financial' },
          { id: 'edit_salary', labelAr: 'تعديل بيانات الراتب', labelEn: 'Edit Salary Data', type: 'sensitive' },
          { id: 'manage_files', labelAr: 'إدارة ملفات الموظف', labelEn: 'Manage Employee Files', type: 'edit' },
          { id: 'qiwa_muqeem', labelAr: 'فتح بوابة قوى ومقيم', labelEn: 'Access Qiwa & Muqeem Portals', type: 'exec' }
        ]
      },
      leaves: {
        ar: 'الإجازات والأرصدة', en: 'Leaves & Balances',
        perms: [
          { id: 'view_balances', labelAr: 'عرض أرصدة الإجازات', labelEn: 'View Leave Balances', type: 'view' },
          { id: 'edit_balances', labelAr: 'تعديل الرصيد السنوي والمستخدم', labelEn: 'Edit Annual & Utilized Leave Balances', type: 'sensitive' },
          { id: 'add_leave', labelAr: 'إنشاء طلب إجازة', labelEn: 'Create Leave Request', type: 'add' },
          { id: 'edit_leave', labelAr: 'تعديل طلب إجازة', labelEn: 'Edit Leave Request', type: 'edit' },
          { id: 'delete_leave', labelAr: 'حذف طلب إجازة', labelEn: 'Delete Leave Request', type: 'delete' },
          { id: 'approve_leave', labelAr: 'اعتماد / رفض طلب إجازة', labelEn: 'Approve / Reject Leave Request', type: 'approve' }
        ]
      },
      payroll: {
        ar: 'مسير الرواتب', en: 'Payroll Management',
        perms: [
          { id: 'view_payroll', labelAr: 'عرض مسير الرواتب', labelEn: 'View Payroll', type: 'financial' },
          { id: 'edit_components', labelAr: 'تعديل الرواتب الأساسية والبدلات', labelEn: 'Edit Basic Salaries & Allowances', type: 'sensitive' },
          { id: 'create_payroll', labelAr: 'إنشاء مسير راتب شهري', labelEn: 'Generate Monthly Payroll', type: 'add' },
          { id: 'approve_payroll', labelAr: 'اعتماد مسير راتب', labelEn: 'Approve Payroll', type: 'approve' },
          { id: 'revert_payroll_draft', labelAr: 'إرجاع مسير الرواتب كمسودة', labelEn: 'Revert Payroll to Draft', type: 'sensitive' },
          { id: 'print_payroll', labelAr: 'طباعة/تصدير مسير الرواتب', labelEn: 'Print/Export Payroll', type: 'export' },
          { id: 'post_mudad', labelAr: 'تسجيل دفعة راتب لبوابة مدد', labelEn: 'Post Payroll Payment to Mudad Portal', type: 'exec' }
        ]
      },
      deductions: {
        ar: 'الخصومات والجزاءات', en: 'Deductions & Penalties',
        perms: [
          { id: 'view_deductions', labelAr: 'عرض الخصومات والجزاءات', labelEn: 'View Deductions & Penalties', type: 'view' },
          { id: 'add_deduction', labelAr: 'إضافة خصم/جزاء', labelEn: 'Add Deduction / Penalty', type: 'add' },
          { id: 'edit_deduction', labelAr: 'تعديل/إلغاء خصم', labelEn: 'Edit / Cancel Deduction', type: 'edit' },
          { id: 'approve_deduction', labelAr: 'اعتماد خصم', labelEn: 'Approve Deduction', type: 'approve' }
        ]
      },
      performance: {
        ar: 'الكفاءات والأداء', en: 'Competencies & Performance',
        perms: [
          { id: 'view_perf', labelAr: 'عرض تقييمات الأداء', labelEn: 'View Performance Reviews', type: 'view' },
          { id: 'add_perf', labelAr: 'إضافة تقييم أداء', labelEn: 'Add Performance Review', type: 'add' },
          { id: 'approve_perf', labelAr: 'اعتماد تقييم أداء', labelEn: 'Approve Performance Review', type: 'approve' }
        ]
      },
      letters: {
        ar: 'مستندات الخطابات الفورية', en: 'Instant Letter Documents',
        perms: [
          { id: 'view_letters', labelAr: 'عرض مستندات الخطابات', labelEn: 'View Letter Documents', type: 'view' },
          { id: 'create_letter', labelAr: 'إنشاء خطاب موظف', labelEn: 'Create Employee Letter', type: 'add' },
          { id: 'edit_letter_template', labelAr: 'إدارة قوالب الخطابات', labelEn: 'Manage Letter Templates', type: 'sensitive' }
        ]
      }
    }
  },
  sales: {
    ar: 'المبيعات والتحصيل', en: 'Sales & Collection',
    icon: <Briefcase className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات', en: 'Sales Dashboard & Metrics',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة مؤشرات المبيعات', labelEn: 'View Sales Dashboard Metrics', type: 'view' },
          { id: 'view_financial', labelAr: 'عرض إجمالي التحصيل والمتبقي والمتأخرات', labelEn: 'View Total Collection, Remaining & Overdue Amounts', type: 'financial' }
        ]
      },
      clients: {
        ar: 'العملاء', en: 'Clients',
        perms: [
          { id: 'view_clients', labelAr: 'عرض قائمة العملاء', labelEn: 'View Client List', type: 'view' },
          { id: 'add_client', labelAr: 'إضافة عميل جديد', labelEn: 'Add New Client', type: 'add' },
          { id: 'edit_client', labelAr: 'تعديل بيانات العميل', labelEn: 'Edit Client Data', type: 'edit' },
          { id: 'delete_client', labelAr: 'حذف عميل', labelEn: 'Delete Client', type: 'delete' },
          { id: 'import_clients', labelAr: 'استيراد عملاء', labelEn: 'Import Clients', type: 'add' }
        ]
      },
      quotations: {
        ar: 'عروض الأسعار', en: 'Quotations',
        perms: [
          { id: 'view_quotes', labelAr: 'عرض قائمة عروض الأسعار', labelEn: 'View Quotation List', type: 'view' },
          { id: 'add_quote', labelAr: 'إضافة عرض سعر', labelEn: 'Add Quotation', type: 'add' },
          { id: 'edit_quote', labelAr: 'تعديل عرض سعر', labelEn: 'Edit Quotation', type: 'edit' },
          { id: 'delete_quote', labelAr: 'حذف عرض سعر مسودة', labelEn: 'Delete Draft Quotation', type: 'delete' },
          { id: 'delete_approved_quote', labelAr: 'حذف عرض سعر معتمد*', labelEn: 'Delete Approved Quotation*', type: 'sensitive' },
          { id: 'approve_quote', labelAr: 'اعتماد عرض سعر', labelEn: 'Approve Quotation', type: 'approve' },
          { id: 'unapprove_quote', labelAr: 'إلغاء اعتماد عرض سعر*', labelEn: 'Unapprove Quotation*', type: 'sensitive' },
          { id: 'send_production', labelAr: 'إرسال العرض للإنتاج', labelEn: 'Send Quotation to Production', type: 'exec' }
        ]
      },
      collection: {
        ar: 'قسم التحصيل المالي', en: 'Financial Collection Department',
        perms: [
          { id: 'view_collection', labelAr: 'عرض قسم التحصيل المالي', labelEn: 'View Financial Collection Department', type: 'view' },
          { id: 'add_plan', labelAr: 'إضافة خطة تحصيل', labelEn: 'Add Collection Plan', type: 'add' },
          { id: 'edit_plan', labelAr: 'تعديل خطة تحصيل', labelEn: 'Edit Collection Plan', type: 'edit' },
          { id: 'add_payment', labelAr: 'تسجيل دفعة', labelEn: 'Record Payment', type: 'add' },
          { id: 'approve_payment', labelAr: 'اعتماد دفعة مالية', labelEn: 'Approve Financial Payment', type: 'approve' },
          { id: 'unapprove_payment', labelAr: 'إلغاء اعتماد دفعة مالية*', labelEn: 'Unapprove Financial Payment*', type: 'sensitive' },
          { id: 'delete_payment', labelAr: 'حذف دفعة*', labelEn: 'Delete Payment*', type: 'sensitive' },
          { id: 'delete_confirmed_collection', labelAr: 'حذف تحصيل معتمد/مكتمل الدفعات*', labelEn: 'Delete Approved/Fully Paid Collection*', type: 'sensitive' }
        ]
      },
      prod_orders: {
        ar: 'طلبات الإنتاج المرسلة', en: 'Sent Production Orders',
        perms: [
          { id: 'view_prod_orders', labelAr: 'عرض طلبات الإنتاج المرسلة', labelEn: 'View Sent Production Orders', type: 'view' },
          { id: 'resend_prod', labelAr: 'إعادة إرسال طلب للإنتاج', labelEn: 'Resend Order to Production', type: 'exec' },
          { id: 'delete_prod_order', labelAr: 'حذف طلب إنتاج', labelEn: 'Delete Production Order', type: 'delete' }
        ]
      },
      letters: {
        ar: 'خطابات المبيعات', en: 'Sales Letters',
        perms: [
          { id: 'view_letters', labelAr: 'عرض خطابات المبيعات', labelEn: 'View Sales Letters', type: 'view' },
          { id: 'add_letter', labelAr: 'إنشاء/تعديل خطاب', labelEn: 'Create / Edit Letter', type: 'add' },
          { id: 'send_letter', labelAr: 'إرسال خطاب عبر واتساب/إيميل', labelEn: 'Send Letter via WhatsApp/Email', type: 'exec' },
          { id: 'edit_letter_template', labelAr: 'إدارة قوالب خطابات المبيعات', labelEn: 'Manage Sales Letter Templates', type: 'sensitive' }
        ]
      },
      reports: {
        ar: 'التقارير', en: 'Reports',
        perms: [
          { id: 'view_reports', labelAr: 'عرض مركز التقارير المبيعات', labelEn: 'View Sales Report Center', type: 'view' },
          { id: 'export_reports', labelAr: 'تصدير التقارير', labelEn: 'Export Reports', type: 'export' }
        ]
      },
      reps: {
        ar: 'المندوبين والأهداف', en: 'Sales Representatives & Targets',
        perms: [
          { id: 'view_reps', labelAr: 'عرض المندوبين والأهداف', labelEn: 'View Sales Representatives & Targets', type: 'view' },
          { id: 'manage_targets', labelAr: 'تعديل الأهداف والعمولات', labelEn: 'Manage Targets & Commissions', type: 'edit' },
          { id: 'approve_comission', labelAr: 'اعتماد عمولة', labelEn: 'Approve Commission', type: 'approve' }
        ]
      },
      pricing_study: {
        ar: 'دراسة تسعير المشاريع', en: 'Project Pricing Study',
        perms: [
          { id: 'view_pricing_study', labelAr: 'عرض دراسة تسعير المشاريع وحساب تكاليفها', labelEn: 'View Project Pricing Studies & Cost Calculation', type: 'view' },
          { id: 'edit_pricing_study', labelAr: 'إنشاء وتعديل دراسة تسعير المشاريع والكميات والأسعار', labelEn: 'Create & Edit Project Pricing Studies, Quantities & Prices', type: 'edit' }
        ]
      }
    }
  },
  procurement: {
    ar: 'المشتريات والمستودع', en: 'Procurement & Inventory',
    icon: <Package className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات للمستودع', en: 'Procurement & Inventory Dashboard',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة المؤشرات للمشتريات والمستودع', labelEn: 'View Procurement & Inventory Dashboard Metrics', type: 'view' }
        ]
      },
      items: {
        ar: 'مستودع الأصناف', en: 'Item Inventory',
        perms: [
          { id: 'view_items', labelAr: 'عرض مستودع الأصناف', labelEn: 'View Item Inventory', type: 'view' },
          { id: 'manage_items', labelAr: 'إضافة وتعديل وحذف صنف', labelEn: 'Add, Edit & Delete Item', type: 'edit' },
          { id: 'approve_item', labelAr: 'اعتماد صنف', labelEn: 'Approve Item', type: 'approve' }
        ]
      },
      materials: {
        ar: 'مستودع المواد', en: 'Material Inventory',
        perms: [
          { id: 'view_materials', labelAr: 'عرض مستودع المواد', labelEn: 'View Material Inventory', type: 'view' },
          { id: 'manage_materials', labelAr: 'إضافة/تعديل مادة', labelEn: 'Add / Edit Material', type: 'edit' },
          { id: 'adjust_qty', labelAr: 'تعديل الرصيد يدويا/صرف مادة', labelEn: 'Manually Adjust Balance / Issue Material', type: 'sensitive' },
          { id: 'inventory_audit', labelAr: 'جرد المواد واعتماده', labelEn: 'Audit & Approve Material Inventory', type: 'approve' }
        ]
      },
      requests: {
        ar: 'طلبات شراء المواد', en: 'Material Purchase Requests',
        perms: [
          { id: 'view_requests', labelAr: 'عرض طلبات شراء المواد', labelEn: 'View Material Purchase Requests', type: 'view' },
          { id: 'add_request', labelAr: 'إنشاء/تعديل طلب شراء', labelEn: 'Create / Edit Purchase Request', type: 'add' },
          { id: 'approve_request', labelAr: 'اعتماد/رفض طلب شراء', labelEn: 'Approve / Reject Purchase Request', type: 'approve' },
          { id: 'send_pricing', labelAr: 'إرسال للموردين والتسعير', labelEn: 'Send to Suppliers for Quotation', type: 'exec' }
        ]
      },
      suppliers: {
        ar: 'الموردين والتسعير', en: 'Suppliers & Quotations',
        perms: [
          { id: 'view_suppliers', labelAr: 'عرض الموردين', labelEn: 'View Suppliers', type: 'view' },
          { id: 'manage_suppliers', labelAr: 'إضافة/تعديل مورد', labelEn: 'Add / Edit Supplier', type: 'edit' },
          { id: 'issue_rfq', labelAr: 'إصدار/تعديل عرض سعر شراء', labelEn: 'Issue / Edit Purchase Quotation (RFQ)', type: 'add' }
        ]
      },
      finance_approval: {
        ar: 'بوابة تعميد المشتريات المالية', en: 'Financial Procurement Approval Portal',
        perms: [
          { id: 'view_finance_po', labelAr: 'عرض بوابات التعميد المالي', labelEn: 'View Financial Approval Portals', type: 'view' },
          { id: 'approve_finance_po', labelAr: 'اعتماد مالياً و إنشاء أمر شراء', labelEn: 'Financial Approval & Purchase Order Creation', type: 'financial' },
          { id: 'undo_po', labelAr: 'التراجع عن أمر شراء بعد إنشائه', labelEn: 'Undo Purchase Order After Creation', type: 'sensitive' },
          { id: 'reject_finance_po', labelAr: 'إعادة الطلب/الرفض المالي', labelEn: 'Reopen Request / Financial Rejection', type: 'edit' },
          { id: 'delete_finance_po', labelAr: 'حذف طلب تعميد مشتريات (للإدارة)', labelEn: 'Delete Procurement Approval Request (Admin)', type: 'delete' }
        ]
      },
      daily_purchases: {
        ar: 'طلبات الشراء اليومية', en: 'Daily Purchase Requests',
        perms: [
          { id: 'view_daily_purchases', labelAr: 'عرض طلبات الشراء اليومية', labelEn: 'View Daily Purchases', type: 'view' },
          { id: 'add_daily_purchase', labelAr: 'إضافة/تعديل طلب شراء يومي', labelEn: 'Add/Edit Daily Purchase', type: 'add' },
          { id: 'confirm_finance_daily', labelAr: 'تأكيد ودفع الطلبات من المالية', labelEn: 'Confirm & Pay Daily Requests (Finance)', type: 'approve' },
          { id: 'delete_daily_purchase', labelAr: 'حذف طلب شراء يومي (للإدارة)', labelEn: 'Delete Daily Purchase (Admin)', type: 'delete' }
        ]
      },
      approved_po: {
        ar: 'أوامر شراء المواد المعتمدة', en: 'Approved Material Purchase Orders',
        perms: [
          { id: 'view_pos', labelAr: 'عرض أوامر الشراء المعتمدة', labelEn: 'View Approved Purchase Orders', type: 'view' },
          { id: 'receive_items', labelAr: 'تسجيل استلام المواد', labelEn: 'Record Material Receipt', type: 'add' },
          { id: 'cancel_po', labelAr: 'التراجع عن أمر الشراء', labelEn: 'Cancel Purchase Order', type: 'sensitive' }
        ]
      }
    }
  },
  production: {
    ar: 'مركز التحكم بالإنتاج', en: 'Production Control Center',
    icon: <Box className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات للإنتاج', en: 'Production Dashboard & Metrics',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة المؤشرات في مركز التحكم بالإنتاج', labelEn: 'View Production Control Center Dashboard Metrics', type: 'view' }
        ]
      },
      daily_followup: {
        ar: 'متابعة الإنتاج اليومية', en: 'Daily Production Follow-up',
        perms: [
          { id: 'view_daily_followup', labelAr: 'عرض متابعة الإنتاج اليومية', labelEn: 'View Daily Production Follow-up', type: 'view' },
          { id: 'edit_daily_followup', labelAr: 'تعديل متابعة الإنتاج اليومية', labelEn: 'Edit Daily Production Follow-up', type: 'edit' },
          { id: 'manage_daily_followup', labelAr: 'إدارة متابعة الإنتاج اليومية', labelEn: 'Manage Daily Production Follow-up', type: 'approve' },
          { id: 'delete_daily_followup', labelAr: 'حذف مشروع من المتابعة', labelEn: 'Delete Project from Follow-up', type: 'delete' }
        ]
      },
      received: {
        ar: 'طلبات الإنتاج المستلمة', en: 'Received Production Requests',
        perms: [
          { id: 'view_received', labelAr: 'عرض طلبات الإنتاج المستلمة', labelEn: 'View Received Production Requests', type: 'view' },
          { id: 'accept_reject', labelAr: 'استلام أو رفض طلب الإنتاج', labelEn: 'Accept or Reject Production Request', type: 'approve' },
          { id: 'create_order', labelAr: 'إنشاء أمر إنتاج من الطلب', labelEn: 'Create Production Order from Request', type: 'add' },
          { id: 'view_cost_pricing', labelAr: 'عرض تفاصيل الأسعار والأصناف بالفاتورة', labelEn: 'View Invoice Pricing & Item Details', type: 'financial' }
        ]
      },
      orders: {
        ar: 'أوامر الإنتاج', en: 'Production Orders',
        perms: [
          { id: 'view_orders', labelAr: 'عرض أوامر الإنتاج', labelEn: 'View Production Orders', type: 'view' },
          { id: 'manage_orders', labelAr: 'تعديل وحذف أمر إنتاج', labelEn: 'Edit & Delete Production Order', type: 'edit' },
          { id: 'approve_orders', labelAr: 'اعتماد / إلغاء تعميد أمر إنتاج', labelEn: 'Approve / Unapprove Production Order', type: 'approve' }
        ]
      },
      projects: {
        ar: 'مشاريع الإنتاج القائمة', en: 'Ongoing Production Projects',
        perms: [
          { id: 'view_projects', labelAr: 'عرض مشاريع الإنتاج', labelEn: 'View Production Projects', type: 'view' },
          { id: 'manage_stages', labelAr: 'إضافة/تعديل/بدء مراحل الإنتاج', labelEn: 'Add / Edit / Start Production Stages', type: 'exec' },
          { id: 'mark_ready', labelAr: 'تحويل المشروع لجاهز للتركيب', labelEn: 'Mark Project as Ready for Installation', type: 'approve' },
          { id: 'mark_complete_no_auth', labelAr: 'تحويل لمكتمل بدون اعتماد النهائي*', labelEn: 'Mark as Complete Without Final Approval*', type: 'sensitive' }
        ]
      },
      installation: {
        ar: 'قسم التركيب والتشغيل', en: 'Installation & Commissioning Department',
        perms: [
          { id: 'view_install', labelAr: 'عرض طلبات/أوامر التركيب', labelEn: 'View Installation Requests/Orders', type: 'view' },
          { id: 'schedule_install', labelAr: 'جدولة و تعيين فريق تركيب', labelEn: 'Schedule & Assign Installation Team', type: 'exec' },
          { id: 'complete_install', labelAr: 'إكمال وإغلاق ملف التركيب', labelEn: 'Complete & Close Installation File', type: 'approve' }
        ]
      }
    }
  },
  finance: {
    ar: 'المحاسبة والمالية', en: 'Accounting & Finance',
    icon: <DollarSign className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات حقة المحاسبة', en: 'Accounting Dashboard',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة قيادة المؤشرات المالية', labelEn: 'View Accounting Dashboard', type: 'view' },
          { id: 'edit_dashboard', labelAr: 'تحديث بيانات المؤشرات والتحكم باللوحة', labelEn: 'Update Metrics Data & Control Dashboard', type: 'edit' }
        ]
      },
      journal: {
        ar: 'القيود اليومية العامة', en: 'General Journal',
        perms: [
          { id: 'view_entries', labelAr: 'عرض دفتر القيود اليومية', labelEn: 'View Journal Entries', type: 'view' },
          { id: 'add_entry', labelAr: 'إضافة قيد جديد', labelEn: 'Add New Entry', type: 'add' },
          { id: 'edit_entry', labelAr: 'تعديل قيد يومية', labelEn: 'Edit Journal Entry', type: 'edit' },
          { id: 'submit_approval', labelAr: 'إرسال القيد للاعتماد', labelEn: 'Submit Entry for Approval', type: 'exec' },
          { id: 'approve_entry', labelAr: 'اعتماد قيد اليومية', labelEn: 'Approve Journal Entry', type: 'approve' },
          { id: 'print_entry', labelAr: 'طباعة/تصدير القيد', labelEn: 'Print/Export Journal Entry', type: 'export' },
          { id: 'view_projects', labelAr: 'عرض المشاريع بالقيود', labelEn: 'View Projects in Journal Entries', type: 'view' },
          { id: 'upload_attachment', labelAr: 'رفع مرفقات القيود', labelEn: 'Upload Journal Entry Attachments', type: 'add' }
        ]
      },
      customer_invoices: {
        ar: 'فواتير العملاء', en: 'Customer Invoices',
        perms: [
          { id: 'view_portal', labelAr: 'عرض بوابة فواتير العملاء', labelEn: 'View Customer Invoices', type: 'view' },
          { id: 'add_invoice', labelAr: 'إضافة فاتورة عميل جديدة', labelEn: 'Add New Customer Invoice', type: 'add' },
          { id: 'edit_invoice', labelAr: 'تعديل فاتورة عميل', labelEn: 'Edit Customer Invoice', type: 'edit' },
          { id: 'approve_invoice', labelAr: 'اعتماد فاتورة عميل', labelEn: 'Approve Customer Invoice', type: 'approve' },
          { id: 'export_all', labelAr: 'تصدير كامل فواتير العملاء', labelEn: 'Export All Customer Invoices', type: 'export' },
          { id: 'preview_invoice', labelAr: 'معاينة وطباعة فاتورة عميل', labelEn: 'Preview & Print Customer Invoice', type: 'view' }
        ]
      },
      revenues: {
        ar: 'الإيرادات والمستحقات', en: 'Revenues',
        perms: [
          { id: 'view_revenues', labelAr: 'عرض الإيرادات المستحقة', labelEn: 'View Outstanding Revenues', type: 'view' },
          { id: 'edit_revenues', labelAr: 'تعديل الإيرادات والمستحقات المضافة', labelEn: 'Edit Added Revenues & Accruals', type: 'edit' }
        ]
      },
      supplier_invoices: {
        ar: 'فواتير الموردين', en: 'Supplier Invoices',
        perms: [
          { id: 'view_portal', labelAr: 'عرض بوابة فواتير الموردين', labelEn: 'View Supplier Invoices', type: 'view' },
          { id: 'add_invoice', labelAr: 'إضافة فاتورة مورد جديدة', labelEn: 'Add New Supplier Invoice', type: 'add' },
          { id: 'edit_invoice', labelAr: 'تعديل فاتورة مورد', labelEn: 'Edit Supplier Invoice', type: 'edit' },
          { id: 'approve_invoice', labelAr: 'اعتماد فاتورة مورد', labelEn: 'Approve Supplier Invoice', type: 'approve' }
        ]
      },
      expenses: {
        ar: 'المصروفات والمستحقات', en: 'Expenses',
        perms: [
          { id: 'view_expenses', labelAr: 'عرض المصروفات والمستحقات', labelEn: 'View Expenses', type: 'view' },
          { id: 'edit_expenses', labelAr: 'تعديل المصروفات المستحقة', labelEn: 'Edit Expenses', type: 'edit' }
        ]
      },
      payroll: {
        ar: 'الرواتب الشهرية للأقسام', en: 'Monthly Payroll',
        perms: [
          { id: 'view_payroll', labelAr: 'الاطلاع على الرواتب الشهرية فقط', labelEn: 'View Payroll Only', type: 'view' },
          { id: 'edit_payroll', labelAr: 'تعديل ومعالجة الرواتب الشهرية بالكامل', labelEn: 'Process & Edit Payroll', type: 'edit' },
          { id: 'revert_to_draft', labelAr: 'إرجاع مسير الرواتب إلى مسودة', labelEn: 'Revert Payroll to Draft', type: 'sensitive' },
          { id: 'audit_payroll_edit', labelAr: 'مراجعة وتدقيق - مع إمكانية التعديل', labelEn: 'Review & Audit - With Edit', type: 'edit' },
          { id: 'audit_payroll_view', labelAr: 'مراجعة وتدقيق - للاطلاع فقط دون تعديل', labelEn: 'Review & Audit - View Only', type: 'view' }
        ]
      },
      cash_bank: {
        ar: 'الصندوق والبنك', en: 'Cash & Banks',
        perms: [
          { id: 'view_portal', labelAr: 'الاطلاع على الصندوق والبنك', labelEn: 'View Cash & Bank Accounts', type: 'view' },
          { id: 'manage_cash_boxes', labelAr: 'إدارة الحسابات والحركات المالية بالكامل', labelEn: 'Manage All Accounts & Financial Transactions', type: 'edit' }
        ]
      },
      zakat_tax: {
        ar: 'قسم الزكاة والضريبة', en: 'Zakat & Tax Department',
        perms: [
          { id: 'view_zakat_tax', labelAr: 'عرض قسم الزكاة والضريبة', labelEn: 'View Zakat & Tax Department', type: 'view' },
          { id: 'register_tax_payment', labelAr: 'تسجيل سداد الضريبة أو الزكاة', labelEn: 'Register Tax or Zakat Payment', type: 'financial' },
          { id: 'export_zakat_tax', labelAr: 'تصدير كشف الزكاة والضريبة', labelEn: 'Export Zakat & Tax Statement', type: 'export' }
        ]
      },
      reports: {
        ar: 'التقارير الحسابية', en: 'Accounting Reports',
        perms: [
          { id: 'view_reports', labelAr: 'عرض صفحة التقارير الحسابية', labelEn: 'View Accounting Reports Page', type: 'view' },
          { id: 'export_reports', labelAr: 'تصدير التقارير الحسابية والأرباح والخسائر', labelEn: 'Export Accounting, Profit & Loss Reports', type: 'export' }
        ]
      },
      zatca: {
        ar: 'إعدادات الزكاة والضريبة ZATCA', en: 'ZATCA Zakat & Tax Settings',
        perms: [
          { id: 'view_zatca', labelAr: 'عرض إعدادات زاتكا وتكامل الفواتير', labelEn: 'View ZATCA Settings & Invoice Integration', type: 'view' },
          { id: 'edit_zatca', labelAr: 'تعديل إعدادات زاتكا والربط الضريبي', labelEn: 'Edit ZATCA Settings & Tax Integration', type: 'sensitive' }
        ]
      },
      eos_calculator: {
        ar: 'حاسبة مستحقات نهاية الخدمة والإجازات', en: 'EOS & Vacation Calculator',
        perms: [
          { id: 'view_calculator', labelAr: 'عرض حاسبة مستحقات نهاية الخدمة والإجازات', labelEn: 'View End of Service & Leave Calculator', type: 'view' },
          { id: 'create_calc', labelAr: 'إنشاء حساب وتصفية (اختيار موظف والنوع)', labelEn: 'Create Calculation & Settlement', type: 'add' },
          { id: 'view_formulas', labelAr: 'عرض تفاصيل المعادلات والاحتسابات التلقائية', labelEn: 'View Live Mathematical Formulas & Equations', type: 'view' },
          { id: 'view_saved', labelAr: 'عرض سجل العمليات الحسابية والتصفيات المحفوظة', labelEn: 'View Saved Calculations Log', type: 'view' },
          { id: 'scope_all', labelAr: 'رؤية حسابات وتصفيات جميع الموظفين بالنظام', labelEn: 'Scope: View All Employee Settlements', type: 'view' },
          { id: 'scope_own', labelAr: 'رؤية حسابات وتصفيات الموظفين الخاصة بي فقط', labelEn: 'Scope: View Own User Calculations Only', type: 'view' },
          { id: 'print_calc', labelAr: 'طباعة وتصدير مستند التصفية', labelEn: 'Print & Export Settlement Document', type: 'export' },
          { id: 'approve_calc', labelAr: 'اعتماد التصفية والعملية الحسابية (تفعيل زر الاعتماد)', labelEn: 'Approve Calculation & Settlement', type: 'approve' },
          { id: 'revoke_approval', labelAr: 'إلغاء الاعتماد (للإدارة)', labelEn: 'Revoke Settlement Approval', type: 'sensitive' },
          { id: 'edit_calc', labelAr: 'تعديل الحسبة والعملية الحسابية', labelEn: 'Edit Saved Calculation', type: 'edit' },
          { id: 'delete_calc', labelAr: 'حذف سجل العملية الحسابية', labelEn: 'Delete Saved Calculation Log', type: 'delete' }
        ]
      },
      firas: {
        ar: 'المحاسب المالي الذكي (فراس)', en: 'Smart Financial Accountant (Firas)',
        perms: [
          { id: 'view_firas', labelAr: 'الوصول واستخدام المحاسب المالي الذكي', labelEn: 'Access and Use Smart Financial Accountant', type: 'view' },
          { id: 'save_chats', labelAr: 'حفظ وتصدير محادثات المحاسب الذكي', labelEn: 'Save and Export Smart Accountant Chats', type: 'add' }
        ]
      }
    }
  },
  settings: {
    ar: 'المستخدمين والإعدادات', en: 'Users & System Settings',
    icon: <Settings className="w-5 h-5"/>,
    sub: {
      users: {
        ar: 'بوابة الصلاحيات والمستخدمين', en: 'Permissions & User Management Portal',
        perms: [
          { id: 'view_users', labelAr: 'عرض بوابة المستخدمين', labelEn: 'View User Portal', type: 'view' },
          { id: 'add_user', labelAr: 'إضافة مستخدم جديد', labelEn: 'Add New User', type: 'add' },
          { id: 'edit_user', labelAr: 'تعديل/حذف مستخدم', labelEn: 'Edit / Delete User', type: 'sensitive' },
          { id: 'manage_permissions', labelAr: 'تعديل الصلاحيات للمستخدمين', labelEn: 'Manage User Permissions', type: 'sensitive' }
        ]
      },
      general: {
        ar: 'الإعدادات العامة', en: 'General Settings',
        perms: [
          { id: 'view_settings', labelAr: 'عرض الإعدادات العامة', labelEn: 'View General Settings', type: 'view' },
          { id: 'edit_settings', labelAr: 'تعديل بيانات الشركة وإعدادات النظام', labelEn: 'Edit Company Data & System Settings', type: 'edit' },
          { id: 'database_backup', labelAr: 'تصدير/استيراد نسخة احتياطية', labelEn: 'Export / Import Database Backup', type: 'sensitive' }
        ]
      },
      audit: {
        ar: 'سجل العمليات والتدقيق', en: 'Audit Log',
        perms: [
          { id: 'view_audit', labelAr: 'عرض سجل التدقيق بالكامل', labelEn: 'View Full Audit Log', type: 'view' },
          { id: 'delete_audit', labelAr: 'حذف أو تفريغ السجل', labelEn: 'Delete or Clear Audit Log', type: 'sensitive' }
        ]
      }
    }
  },
  notifications: {
    ar: 'إشعارات النظام', en: 'System Notifications',
    icon: <Settings className="w-5 h-5"/>,
    sub: {
      general: {
        ar: 'عرض الإشعارات', en: 'View Notifications',
        perms: [
          { id: 'view_all', labelAr: 'عرض جميع إشعارات النظام', labelEn: 'View All System Notifications', type: 'view' },
          { id: 'view_hr', labelAr: 'عرض إشعارات الموارد البشرية', labelEn: 'View HR Notifications', type: 'view' },
          { id: 'view_sales', labelAr: 'عرض إشعارات المبيعات', labelEn: 'View Sales Notifications', type: 'view' },
          { id: 'view_purchasing', labelAr: 'عرض إشعارات المشتريات', labelEn: 'View Procurement Notifications', type: 'view' },
          { id: 'view_production', labelAr: 'عرض إشعارات الانتاج', labelEn: 'View Production Notifications', type: 'view' },
          { id: 'view_finance', labelAr: 'عرض إشعارات المحاسبة المالية', labelEn: 'View Financial Accounting Notifications', type: 'view' },
          { id: 'view_public', labelAr: 'عرض الاشعارات العامة', labelEn: 'View Public Notifications', type: 'view' },
          { id: 'view_private', labelAr: 'عرض الاشعارات الخاصة', labelEn: 'View Private Notifications', type: 'view' }
        ]
      }
    }
  }
};

const COLOR_MAP: Record<string, string> = {
  view: 'text-blue-700 bg-blue-50 border-blue-200 accent-blue-600',
  add: 'text-emerald-700 bg-emerald-50 border-emerald-200 accent-emerald-600',
  edit: 'text-orange-700 bg-orange-50 border-orange-200 accent-orange-600',
  delete: 'text-red-700 bg-red-50 border-red-200 accent-red-600',
  approve: 'text-purple-700 bg-purple-50 border-purple-200 accent-purple-600',
  financial: 'text-emerald-800 bg-emerald-100 border-emerald-300 accent-emerald-700',
  sensitive: 'text-rose-800 bg-rose-100 border-rose-300 accent-rose-700',
  exec: 'text-indigo-800 bg-indigo-50 border-indigo-200 accent-indigo-600',
  export: 'text-slate-700 bg-slate-100 border-slate-300 accent-slate-600'
};

const BADGE_MAP: Record<string, { labelAr: string, labelEn: string, color: string }> = {
  sensitive: { labelAr: 'حساسة وخطرة ⚠️', labelEn: 'Sensitive ⚠️', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  financial: { labelAr: 'مالية 💵', labelEn: 'Financial 💵', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  approve: { labelAr: 'اعتماد ✍️', labelEn: 'Approval ✍️', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  delete: { labelAr: 'حذف 🗑️', labelEn: 'Delete 🗑️', color: 'bg-red-100 text-red-800 border-red-300' }
};

export default function AdvancedPermissionsPortal({ 
  user,
  allUsers,
  lang,
  onClose,
  onSave
}: any) {
  // We store advanced permissions inside `user.permissions.advanced`
  // mapping structure: { [mainKey]: { [subKey]: { [permId]: boolean } } }
  const isTargetFeras = user.username?.toUpperCase() === 'FERAS';

  const getCompletePermissions = () => {
    const complete: any = {};
    Object.entries(PERMISSIONS_SCHEMA).forEach(([mainKey, mainVal]) => {
      complete[mainKey] = {};
      Object.entries(mainVal.sub).forEach(([subKey, subVal]) => {
        complete[mainKey][subKey] = {};
        subVal.perms.forEach((p: any) => {
          complete[mainKey][subKey][p.id] = 'all';
        });
      });
    });
    return complete;
  };

  const [advPerms, setAdvPerms] = useState<any>(() => {
    if (isTargetFeras) {
      return getCompletePermissions();
    }
    return user.permissions?.advanced || {};
  });
  
  const [scopes, setScopes] = useState<any>(user.permissions?.scopes || { global: 'all' });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [activeMain, setActiveMain] = useState(Object.keys(PERMISSIONS_SCHEMA)[0]);
  const [activeSub, setActiveSub] = useState(Object.keys(PERMISSIONS_SCHEMA[activeMain as keyof typeof PERMISSIONS_SCHEMA].sub)[0]);
  
  const handleToggle = (main: string, sub: string, permId: string, val: boolean) => {
     setAdvPerms((prev: any) => ({
        ...prev,
        [main]: {
           ...(prev[main] || {}),
           [sub]: {
              ...(prev[main]?.[sub] || {}),
              [permId]: val ? 'all' : false
           }
        }
     }));
  };

  const handleScopeChange = (main: string, sub: string, permId: string, scopeVal: string) => {
     setAdvPerms((prev: any) => ({
        ...prev,
        [main]: {
           ...(prev[main] || {}),
           [sub]: {
              ...(prev[main]?.[sub] || {}),
              [permId]: scopeVal
           }
        }
     }));
  };

  const handleToggleSub = (main: string, sub: string, val: boolean) => {
     const subPerms = (PERMISSIONS_SCHEMA as any)[main].sub[sub].perms;
     const newSubState: any = {};
     subPerms.forEach((p: any) => newSubState[p.id] = val ? 'all' : false);
     setAdvPerms((prev: any) => ({
        ...prev,
        [main]: {
           ...(prev[main] || {}),
           [sub]: newSubState
        }
     }));
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    // Generate backwards compatible standard permissions from advanced perms to keep App functional immediately
    // If hr view is true, set viewAccess to 'all'
    const newModuleAccess: any = { ...user.permissions?.moduleAccess };
    Object.keys(PERMISSIONS_SCHEMA).forEach(main => {
       if (main !== 'dashboard' && main !== 'settings') {
          const mainPerms = advPerms[main] || {};
          const hasAnyView = Object.values(mainPerms).some((s: any) => Object.values(s).some(v => !!v));
          const hasAnyAll = Object.values(mainPerms).some((s: any) => Object.values(s).some(v => v === 'all' || v === true));
          
          if (!newModuleAccess[main]) newModuleAccess[main] = {};
          
          const calculatedScope = hasAnyAll ? 'all' : 'own';
          
          newModuleAccess[main].enabled = hasAnyView;
          newModuleAccess[main].viewAccess = hasAnyView ? calculatedScope : 'none';
          newModuleAccess[main].editAccess = hasAnyView ? calculatedScope : 'none'; 
          
          // Settings delete is for users, let's keep it simple
          if (advPerms.settings?.users?.edit_user) {
              newModuleAccess[main].deleteAccess = 'all';
          }
       }
    });

    // Handle procurement specifics carefully to not break the UI right away:
    if (advPerms.procurement?.finance_approval?.view_finance_po) {
        if (!newModuleAccess.procurement) newModuleAccess.procurement = {};
        newModuleAccess.procurement.deleteAccess = 'all'; // Reused standard permission mapped to Senior Management earlier
    }

    const payload = {
       advanced: advPerms,
       scopes: scopes,
       moduleAccess: newModuleAccess
    };

    await onSave(user.id || user.username, payload);
    setSavedSuccess(true);
    setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(false);
        onClose();
    }, 800);
  };

  // Metrics calculation
  let activePermsCount = 0;
  let sensitiveCount = 0;
  let hasFinancial = false;

  Object.values(advPerms).forEach((main: any) => {
     Object.values(main).forEach((sub: any) => {
        Object.entries(sub).forEach(([pid, val]) => {
           if (val) {
              activePermsCount++;
              // Need to find type to count sensitive/fin
              Object.values(PERMISSIONS_SCHEMA).forEach(mst => {
                 Object.values((mst as any).sub).forEach((sst: any) => {
                    const p = sst.perms.find((x: any) => x.id === pid);
                    if (p && p.type === 'sensitive') sensitiveCount++;
                    if (p && p.type === 'financial') hasFinancial = true;
                 });
              });
           }
        })
     })
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm rtl" dir="rtl" style={{ direction: 'rtl' }}>
      <div className="bg-slate-50 w-full max-w-[95vw] lg:max-w-7xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border-2 border-slate-700">
         
         <div className="p-4 sm:p-6 bg-slate-900 text-white shrink-0 flex flex-wrap gap-4 items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
               <Shield className="w-8 h-8 text-indigo-400" />
               <div>
                  <h2 className="text-xl font-black tracking-wide">بوابة الصلاحيات والتحكم بالوصول المتقدمة</h2>
                  <p className="text-xs text-slate-400 mt-1">تخصيص الهيكل الوظيفي ومستويات الوصول (RBAC)</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                   type="button"
                   onClick={() => {
                     setAdvPerms(getCompletePermissions());
                   }}
                   disabled={isSaving}
                   className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-emerald-500/30"
               >
                   <CheckCircle className="w-4 h-4" />
                   منح صلاحيات كاملة
               </button>
               <button 
                   onClick={handleSaveData} 
                   disabled={isSaving}
                   className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg overflow-hidden relative ${
                     savedSuccess ? 'bg-emerald-500 scale-105 shadow-emerald-500/50' :
                     isSaving ? 'bg-indigo-500 opacity-80 cursor-not-allowed scale-95' : 
                     'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/30'
                   }`}
               >
                   {savedSuccess ? (
                      <>
                         <CheckCircle className="w-4 h-4 animate-bounce"/>
                         تم الحفظ بنجاح
                      </>
                   ) : isSaving ? (
                      <>
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         جاري الحفظ...
                      </>
                   ) : (
                      <>
                         <Save className="w-4 h-4"/>
                         حفظ واعتماد الصلاحيات
                      </>
                   )}
               </button>
               <button onClick={onClose} disabled={isSaving} className="p-2.5 bg-slate-800 hover:bg-rose-600 rounded-xl transition text-white">
                   <X className="w-5 h-5" />
               </button>
            </div>
         </div>

         <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
             
             {/* 2. Main Sections Sidebar */}
             <div className={`w-full md:w-64 bg-slate-800 border-slate-700 shrink-0 flex flex-col p-4 gap-2 overflow-y-auto hidden md:flex ${lang === 'ar' ? 'border-l' : 'border-r'}`}>
                <div className="pb-4 mb-4 border-b border-slate-700">
                   <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-700/50">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-inner">
                         {(user?.username || user?.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className={`flex-1 truncate ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                         <h3 className="text-sm font-black text-white truncate">{user.username}</h3>
                         <p className="text-[10px] text-indigo-300 font-bold truncate mt-0.5">{user.jobTitle || (lang === 'ar' ? 'موظف' : 'Employee')}</p>
                      </div>
                   </div>
                </div>

                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-wider rtl:text-right ltr:text-left">{lang === 'ar' ? 'الأقسام الرئيسية' : 'Main Departments'}</h4>
                {Object.entries(PERMISSIONS_SCHEMA).map(([mKey, mVal]) => (
                   <button 
                     key={mKey}
                     onClick={() => {
                        setActiveMain(mKey);
                        setActiveSub(Object.keys((mVal as any).sub)[0]);
                     }}
                     className={`flex items-center gap-3 w-full p-3 transition-all rounded-xl text-sm font-bold rtl:text-right ltr:text-left ${activeMain === mKey ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                   >
                     {mVal.icon}
                     <span>{lang === 'ar' ? mVal.ar : mVal.en}</span>
                   </button>
                ))}
             </div>

             {/* Dynamic Sub-sections list (Middle column) */}
             <div className={`w-full md:w-64 bg-white border-slate-200 shrink-0 flex flex-col p-4 gap-2 overflow-y-auto hidden md:flex ${lang === 'ar' ? 'border-l' : 'border-r'}`}>
                <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-wider flex items-center justify-between text-right">
                   {lang === 'ar' ? 'الأقسام الفرعية' : 'Sub-sections'}
                   <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">{Object.keys((PERMISSIONS_SCHEMA as any)[activeMain].sub).length}</span>
                </h4>
                {Object.entries((PERMISSIONS_SCHEMA as any)[activeMain].sub).map(([sKey, sVal]: [string, any]) => {
                   const hasAnyPerm = Object.values(advPerms[activeMain]?.[sKey] || {}).some(v => v);
                   return (
                     <button 
                       key={sKey}
                       onClick={() => setActiveSub(sKey)}
                       className={`flex items-center justify-between w-full p-3 transition-all rounded-xl text-xs font-bold border rtl:text-right ltr:text-left ${activeSub === sKey ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'}`}
                     >
                       <span>{lang === 'ar' ? sVal.ar : sVal.en}</span>
                       {hasAnyPerm && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                     </button>
                   );
                })}
             </div>

             {/* Permissions area */}
             <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 flex-1 overflow-y-auto">
                    
                    {/* Selectors for mobile only */}
                    <div className="flex md:hidden flex-col gap-2 mb-4 pb-4 border-b border-slate-200">
                        <select 
                           className="p-2 rounded border border-slate-300 text-sm font-bold bg-white"
                           value={activeMain}
                           onChange={(e) => {
                              setActiveMain(e.target.value);
                              setActiveSub(Object.keys((PERMISSIONS_SCHEMA as any)[e.target.value].sub)[0]);
                           }}
                        >
                            {Object.entries(PERMISSIONS_SCHEMA).map(([mKey, mVal]) => (
                               <option key={mKey} value={mKey}>{lang === 'ar' ? mVal.ar : mVal.en}</option>
                            ))}
                        </select>
                        <select 
                           className="p-2 rounded border border-slate-300 text-sm font-bold bg-white"
                           value={activeSub}
                           onChange={(e) => setActiveSub(e.target.value)}
                        >
                            {Object.entries((PERMISSIONS_SCHEMA as any)[activeMain].sub).map(([sKey, sVal]: [string, any]) => (
                               <option key={sKey} value={sKey}>{lang === 'ar' ? sVal.ar : sVal.en}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <div className={`p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                          <div>
                             <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-slate-400" />
                                {lang === 'ar' ? 'صلاحيات' : 'Permissions'}: {(PERMISSIONS_SCHEMA as any)[activeMain].sub[activeSub][lang === 'ar' ? 'ar' : 'en']}
                             </h3>
                             <p className="text-xs text-slate-500 mt-1 font-semibold">{lang === 'ar' ? 'تخصيص دقيق لصلاحيات المستخدم داخل هذا القسم الفرعي.' : 'Granular customization of user permissions within this sub-section.'}</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-4">

                             <div className={`flex items-center gap-3 border-slate-200 ${lang === 'ar' ? 'border-r pr-4' : 'border-l pl-4'}`}>
                                <button 
                                   onClick={() => handleToggleSub(activeMain, activeSub, false)}
                                className="px-3 py-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg text-[11px] font-bold transition"
                             >
                               {lang === 'ar' ? 'تعطيل الكل' : 'Disable All'}
                             </button>
                             <button 
                                onClick={() => handleToggleSub(activeMain, activeSub, true)}
                                className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[11px] font-bold transition shadow-md"
                             >
                               {lang === 'ar' ? 'منح الكل' : 'Grant All'}
                             </button>
                          </div>
                       </div>
                    </div>
                       
                       <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {(PERMISSIONS_SCHEMA as any)[activeMain].sub[activeSub].perms.map((perm: any) => {
                             const permVal = advPerms[activeMain]?.[activeSub]?.[perm.id];
                             const isChecked = !!permVal;
                             const currentScope = permVal === 'own' ? 'own' : 'all';
                             const colorClasses = COLOR_MAP[perm.type] || COLOR_MAP.view;
                             const badge = BADGE_MAP[perm.type];
                             
                             return (
                               <div key={perm.id} className={`flex flex-col p-4 rounded-xl border transition-all hover:shadow-sm ${isChecked ? colorClasses.replace('text-', 'border-').split(' ')[2] : 'bg-white border-slate-200'} ${isChecked ? colorClasses.split(' ')[1] : ''}`}>
                                  <label className="flex flex-row-reverse items-center justify-between cursor-pointer w-full">
                                     <div className="flex items-center gap-3 flex-row-reverse">
                                        <div className={`w-10 h-6 bg-slate-200 rounded-full relative transition-colors ${isChecked ? colorClasses.split(' ')[3].replace('accent-', 'bg-') : ''}`}>
                                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isChecked ? 'left-1' : 'left-5'}`}></div>
                                        </div>
                                        <div className="text-right flex items-center justify-end gap-2 flex-wrap">
                                           <span className={`text-sm font-bold ${isChecked ? colorClasses.split(' ')[0] : 'text-slate-700'}`}>{lang === "ar" ? perm.labelAr : (perm.labelEn || perm.labelAr)}</span>
                                           {badge && <span className={`mr-2 px-1.5 py-0.5 rounded text-[9px] font-black ${badge.color}`}>{lang === "ar" ? badge.labelAr : badge.labelEn}</span>}
                                        </div>
                                     </div>
                                     
                                     {/* hidden checkbox */}
                                     <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={isChecked}
                                        onChange={(e) => handleToggle(activeMain, activeSub, perm.id, e.target.checked)} 
                                      />
                                  </label>

                                  {isChecked && (
                                     <div className="mt-4 pt-3 border-t border-slate-200 flex flex-row-reverse items-center justify-between">
                                        <span className={`text-[10px] font-bold ${colorClasses.split(' ')[0]} opacity-80`}>{lang === 'ar' ? 'نطاق البيانات والمعالجة:' : 'Data & Processing Scope:'}</span>
                                        <select 
                                           value={currentScope}
                                           onChange={(e) => handleScopeChange(activeMain, activeSub, perm.id, e.target.value)}
                                           className={`bg-white border border-slate-200 text-xs font-bold p-1 rounded-md outline-none cursor-pointer ${colorClasses.split(' ')[0]}`}
                                        >
                                           <option value="all">{lang === 'ar' ? 'جميع البيانات (وصول كامل)' : 'All Data (Full Access)'}</option>
                                           <option value="own">{lang === 'ar' ? 'البيانات الخاصة به فقط' : 'Own Data Only'}</option>
                                        </select>
                                     </div>
                                  )}
                               </div>
                             );
                          })}
                       </div>
                    </div>
                </div>

                {/* Footer summary bar */}
                <div className="bg-slate-900 text-white p-4 shrink-0 flex items-center justify-between text-right">
                   <div className="flex items-center gap-6">
                      <div className="text-center">
                         <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'مجموع الصلاحيات المفعلة' : 'Total Active Permissions'}</span>
                         <span className="block text-xl font-black text-indigo-400">{activePermsCount}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-800"></div>
                      <div className="text-center">
                         <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'صلاحيات حساسة وخطرة' : 'Sensitive & Critical Permissions'}</span>
                         <span className="block text-xl font-black text-rose-500">{sensitiveCount}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
                      <div className="text-center hidden sm:block">
                         <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'الوصول المالي الشامل' : 'Global Financial Access'}</span>
                         <span className={`block text-sm font-black mt-1 ${hasFinancial ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {hasFinancial ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'محجوب' : 'Restricted')}
                         </span>
                      </div>
                   </div>
                   
                   <div className="flex gap-2 text-xs font-bold font-mono text-slate-500">
                      SYS_SEC_V2
                   </div>
                </div>

             </div>
         </div>
      </div>
    </div>
  );
}
