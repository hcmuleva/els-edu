import jsPDF from "jspdf";

export const generateInvoicePDF = (invoice) => {
  // Create PDF with A4 size
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  try {
    // --- Colors ---
    const textPrimary = "#37352f";
    const textSecondary = "#787774";
    const borderColor = "#e9e9e9";
    const successColor = "#10B981";

    // --- Helper Functions ---
    const drawLine = (y) => {
      doc.setDrawColor(borderColor);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
    };

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(textPrimary);
    doc.text("Invoice", 20, 30);

    // Company Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(textPrimary);
    doc.text("ELS EDU", 190, 20, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textSecondary);
    doc.text("Learning Management Platform", 190, 26, { align: "right" });
    doc.text("support@elsedu.com", 190, 31, { align: "right" });

    // --- Metadata Section ---
    let yPos = 50;

    // Invoice Number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textSecondary);
    doc.text("Invoice No.", 20, yPos);
    doc.setTextColor(textPrimary);
    doc.text(invoice.invoice_number || "Unknown", 55, yPos);

    yPos += 7;
    doc.setTextColor(textSecondary);
    doc.text("Date", 20, yPos);
    doc.setTextColor(textPrimary);
    const date = new Date(invoice.createdAt || Date.now()).toLocaleDateString(
      "en-IN",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    doc.text(date, 55, yPos);

    yPos += 7;
    doc.setTextColor(textSecondary);
    doc.text("Status", 20, yPos);
    doc.setTextColor(
      invoice.invoice_status === "PAID" ? successColor : textPrimary
    );
    doc.setFont("helvetica", "bold");
    doc.text((invoice.invoice_status || "PAID").toUpperCase(), 55, yPos);

    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textSecondary);
    doc.text("Type", 20, yPos);
    doc.setTextColor(textPrimary);
    const invoiceType =
      invoice.invoice_type === "CONSUMER_INVOICE"
        ? "Consumer Purchase"
        : invoice.invoice_type || "Purchase";
    doc.text(invoiceType, 55, yPos);

    yPos += 12;
    drawLine(yPos);
    yPos += 12;

    // --- Bill To ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textPrimary);
    doc.text("Bill To", 20, yPos);

    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const customerName =
      invoice.customer?.username || invoice.customer_name || "Customer";
    doc.text(customerName, 20, yPos);

    const customerEmail =
      invoice.customer?.email || invoice.customer_email || "";
    if (customerEmail) {
      yPos += 5;
      doc.setTextColor(textSecondary);
      doc.text(customerEmail, 20, yPos);
    }

    yPos += 12;
    drawLine(yPos);
    yPos += 12;

    // --- Purchase Details Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textPrimary);
    doc.text("Purchase Details", 20, yPos);
    yPos += 10;

    // --- Items Table Header ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textSecondary);
    doc.text("Type", 20, yPos);
    doc.text("Description", 45, yPos);
    doc.text("Qty", 140, yPos);
    doc.text("Amount", 190, yPos, { align: "right" });

    yPos += 3;
    drawLine(yPos);
    yPos += 8;

    // --- Item Rows ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textPrimary);

    const items = invoice.invoice_items || [];
    if (items.length > 0) {
      items.forEach((item) => {
        const itemType = item.item_type || "SUBSCRIPTION";
        const itemName =
          item.item_name || item.item_description || "Subscription";
        const qty = item.quantity || 1;
        const amount = item.line_total || item.unit_price || 0;

        // Type badge
        doc.setFontSize(8);
        if (itemType === "COURSE") {
          doc.setTextColor("#3B82F6"); // Blue for course
        } else if (itemType === "SUBJECT") {
          doc.setTextColor("#8B5CF6"); // Purple for subject
        } else {
          doc.setTextColor(textSecondary);
        }
        doc.text(itemType, 20, yPos);

        // Description
        doc.setFontSize(10);
        doc.setTextColor(textPrimary);
        const truncatedName =
          itemName.length > 45 ? itemName.substring(0, 42) + "..." : itemName;
        doc.text(truncatedName, 45, yPos);

        // Qty and Amount
        doc.text(String(qty), 140, yPos);
        doc.text(`₹${amount}`, 190, yPos, { align: "right" });

        yPos += 8;

        // Show course/subject details if available
        if (item.course_name || item.subject_name) {
          doc.setFontSize(8);
          doc.setTextColor(textSecondary);
          if (item.course_name) {
            doc.text(`Course: ${item.course_name}`, 45, yPos);
            yPos += 5;
          }
          if (item.subject_name) {
            doc.text(`Subject: ${item.subject_name}`, 45, yPos);
            yPos += 5;
          }
        }
      });
    } else {
      // Fallback
      doc.text("Course/Subject Subscription", 45, yPos);
      doc.text("1", 140, yPos);
      doc.text(`₹${invoice.total_amount || 0}`, 190, yPos, { align: "right" });
      yPos += 8;
    }

    yPos += 5;
    drawLine(yPos);
    yPos += 12;

    // --- Totals ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.setTextColor(textSecondary);
    doc.text("Subtotal", 140, yPos);
    doc.setTextColor(textPrimary);
    doc.text(`₹${invoice.subtotal || invoice.total_amount || 0}`, 190, yPos, {
      align: "right",
    });
    yPos += 7;

    if (invoice.tax_amount && invoice.tax_amount > 0) {
      doc.setTextColor(textSecondary);
      doc.text("Tax", 140, yPos);
      doc.setTextColor(textPrimary);
      doc.text(`₹${invoice.tax_amount}`, 190, yPos, { align: "right" });
      yPos += 7;
    }

    if (invoice.discount_amount && invoice.discount_amount > 0) {
      doc.setTextColor(textSecondary);
      doc.text("Discount", 140, yPos);
      doc.setTextColor(successColor);
      doc.text(`-₹${invoice.discount_amount}`, 190, yPos, { align: "right" });
      yPos += 7;
    }

    yPos += 3;
    doc.setDrawColor(textPrimary);
    doc.setLineWidth(0.8);
    doc.line(130, yPos, 190, yPos);
    yPos += 8;

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(textPrimary);
    doc.text("Total Paid", 140, yPos);
    doc.text(`₹${invoice.total_amount || 0}`, 190, yPos, { align: "right" });

    // --- Footer ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textSecondary);
    doc.text("Thank you for choosing ELS EDU!", 105, 265, { align: "center" });
    doc.text("This is a computer-generated invoice.", 105, 271, {
      align: "center",
    });
    doc.text("For support, contact support@elsedu.com", 105, 277, {
      align: "center",
    });

    // --- Save ---
    const safeInvoiceNum = (invoice.invoice_number || "Invoice")
      .replace(/[^a-zA-Z0-9-]/g, "_")
      .substring(0, 30);
    const dateStr = new Date(invoice.createdAt || Date.now())
      .toISOString()
      .split("T")[0];
    const filename = `ELS_EDU_${safeInvoiceNum}_${dateStr}.pdf`;

    const blob = doc.output("blob");
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log(`Invoice generated: ${filename}`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate invoice. Please try again.");
  }
};
