const Footer = () => {
  return (
    <footer className="label flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-ink px-4 py-5 text-faded sm:px-7">
      <span className="wide font-sans text-sm font-black tracking-[-0.03em] text-ink">
        Continue<span className="text-house">?</span>
      </span>
      <a
        href="https://rawg.io"
        target="_blank"
        rel="noreferrer"
        className="underline-offset-4 hover:text-ink hover:underline"
      >
        Game data from RAWG
      </a>
    </footer>
  );
};

export default Footer;
