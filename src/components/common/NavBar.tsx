function NavBar() {
  const navLinkClass =
    "px-4 py-1 font-semibold border-2 border-orange-300/50 cursor-pointer transition-all duration-200 hover:bg-orange-300/25 hover:text-orange-300 hover:shadow-[0_0_8px_rgba(253,186,116,0.2)]";

  return (
    <nav className="bg-taupe-900 text-orange-300 h-16 border-b-2 border-orange-300">
      <div className="container flex items-center justify-between h-full mx-auto">
        <h1 className="text-2xl font-extrabold cursor-pointer">
          TVA Files:{" "}
          <span className="px-2 bg-orange-300/25 drop-shadow-[0_0_8px_rgba(253,186,116,0.2)]">
            The Sacred Timeline
          </span>
        </h1>
        <div className="flex items-center gap-x-4">
          <a className={navLinkClass}>Timeline</a>
          <a className={navLinkClass}>Characters</a>
          <span aria-hidden="true" className="text-orange-300/60">
            •
          </span>
          <a className={navLinkClass}>Log in</a>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
