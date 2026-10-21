import { Link } from "react-router";

interface Props {
  message: string;
}

const GameOver = ({ message }: Props) => {
  return (
    <div className="grid justify-items-start gap-5 px-4 py-16 sm:px-7 sm:py-24">
      <h1 className="wide text-[clamp(48px,11vw,140px)] leading-[0.8] font-black tracking-[-0.045em] uppercase">
        Game over
      </h1>
      <p className="font-body text-lg text-faded">{message}</p>
      <Link
        to="/"
        className="label border-2 border-house bg-house px-3 py-2.5 font-bold text-white hover:-rotate-2"
      >
        Continue? Yes → back to the cover
      </Link>
    </div>
  );
};

export default GameOver;
