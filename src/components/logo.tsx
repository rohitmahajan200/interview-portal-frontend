export default function Logo({ open }: { open: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-2 ${open ? 'px-4' : ' justify-center'}`}>
      <img
        src="https://www.change-networks.com/logo.png"
        alt="CHANGE Networks Logo"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onError={(e) => {
          // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
        }}
        className={`${
          open ? "h-8 w-8" : "h-7 w-7"
        } transition-all duration-200 ease-in-out object-contain`}
      />
      {open && (
        <span className="text-sm font-semibold tracking-wide text-card-foreground transition-opacity duration-200">
          CHANGE Networks
        </span>
      )}
    </div>
  );
}
