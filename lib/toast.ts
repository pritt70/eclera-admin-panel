import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  backdrop: false,
  showConfirmButton: false,
  showCloseButton: true,
  closeButtonHtml:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  timer: 2500,
  timerProgressBar: false,
  showClass: {
    popup: "animate-toast-in",
  },
  hideClass: {
    popup: "animate-toast-out",
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

const getSingleLineMessage = (title: string, message?: string) => {
  if (!message) return title;
  if (!title) return message;

  const genericTitles = ["error", "failed", "operation failed", "warning", "info"];
  if (genericTitles.includes(title.toLowerCase().trim())) {
    return message;
  }

  return title;
};

export const toast = {
  success: (title: string, message?: string) => {
    return Toast.fire({
      title: getSingleLineMessage(title, message),
      background: "#047857",
      color: "#ffffff",
      customClass: {
        popup: "toast-success",
      },
    });
  },
  error: (title: string, message?: string) => {
    return Toast.fire({
      title: getSingleLineMessage(title, message),
      background: "#b91c1c",
      color: "#ffffff",
      customClass: {
        popup: "toast-error",
      },
    });
  },
  warning: (title: string, message?: string) => {
    return Toast.fire({
      title: getSingleLineMessage(title, message),
      background: "#b45309",
      color: "#ffffff",
      customClass: {
        popup: "toast-warning",
      },
    });
  },
  info: (title: string, message?: string) => {
    return Toast.fire({
      title: getSingleLineMessage(title, message),
      background: "#1d4ed8",
      color: "#ffffff",
      customClass: {
        popup: "toast-info",
      },
    });
  },
  confirm: async ({
    title = "Are you sure to delete?",
    text,
    confirmButtonText = "Yes",
    cancelButtonText = "No",
  }: {
    title?: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
  } = {}) => {
    const result = await Swal.fire({
      title,
      text: text || undefined,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
      buttonsStyling: false,
      focusCancel: true,
      customClass: {
        popup:
          "swal2-confirm-modal !p-0 !rounded-[4px] !border !border-slate-200 !bg-white !shadow-xl !max-w-[380px] !w-[90%] !overflow-hidden !text-left",
        title:
          "!p-0 !py-5 !px-5 !m-0 !text-sm !font-semibold !text-slate-800 !text-left !leading-normal",
        htmlContainer: text
          ? "!p-0 !pb-4 !px-5 !m-0 !text-xs !text-slate-500 !text-left !leading-relaxed !block"
          : "!hidden",
        actions:
          "!m-0 !w-full !px-5 !py-3 !bg-slate-50/80 !border-t !border-slate-200 !flex !items-center !justify-end !gap-2 !box-border",
        confirmButton:
          "!m-0 !rounded-[3px] !text-xs !font-semibold !px-4 !py-1.5 !bg-[#B4395A] hover:!bg-[#9b2f4c] !text-white !cursor-pointer !transition-colors !shadow-xs !border-0 !outline-none",
        cancelButton:
          "!m-0 !rounded-[3px] !text-xs !font-semibold !px-4 !py-1.5 !bg-white hover:!bg-slate-100 !border !border-slate-300 !text-slate-700 hover:!text-slate-900 !cursor-pointer !transition-colors !outline-none",
      },
    });
    return result.isConfirmed;
  },
};

export default toast;
