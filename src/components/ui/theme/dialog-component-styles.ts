export const dialogComponentStyles = {
  overlay:
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60",
  contentBase:
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex flex-col w-[90%] max-w-[90%] max-h-[75vh] overflow-hidden translate-x-[-50%] translate-y-[-50%] rounded-2xl p-6 duration-200 sm:w-full sm:max-w-lg",
  closeButton:
    "absolute top-4 right-4 rounded-lg text-primary/70 opacity-70 transition-all hover:opacity-100 hover:text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/30 data-[state=open]:bg-primary/10 data-[state=open]:text-primary disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  header: "flex flex-col gap-0 text-center sm:text-left",
  footer: "mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
  title: "text-lg leading-none font-semibold text-primary",
  description: "text-xs text-primary/70",
} as const;
