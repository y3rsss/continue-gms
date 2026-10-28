import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { missingRules, PASSWORD_RULES } from "@/lib/password";
import { cn } from "@/lib/utils";

const INPUT =
  "h-12 w-full min-w-0 border-[1.5px] border-ink bg-paper px-3.5 font-body text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export const Title = ({ children }: { children: ReactNode }) => (
  <Dialog.Title className="wide text-[clamp(40px,11vw,54px)] leading-[0.85] font-black tracking-[-0.04em] uppercase">
    {children}
  </Dialog.Title>
);

export const Lede = ({ children }: { children: ReactNode }) => (
  <p className="mt-3 font-body text-[17px] leading-snug text-faded">{children}</p>
);

interface FieldProps extends ComponentProps<"input"> {
  label: string;
  aside?: ReactNode;
}

export const Field = ({ label, aside, className, ...props }: FieldProps) => {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label font-bold">
          {label}
        </label>
        {aside}
      </div>
      <input id={id} className={cn(INPUT, className)} {...props} />
    </div>
  );
};

interface PasswordFieldProps extends FieldProps {
  value: string;
  rules?: boolean;
}

export const PasswordField = ({ label, aside, rules, ...props }: PasswordFieldProps) => {
  const id = useId();
  const [shown, setShown] = useState(false);

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label font-bold">
          {label}
        </label>
        {aside}
      </div>
      <div className="flex">
        <input
          id={id}
          type={shown ? "text" : "password"}
          aria-describedby={rules ? `${id}-rules` : undefined}
          className={cn(INPUT, "border-r-0")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label="Show password"
          aria-pressed={shown}
          className="grid size-12 shrink-0 place-items-center border-[1.5px] border-ink bg-tint hover:bg-ink hover:text-paper"
        >
          {shown ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      </div>
      {rules && <PasswordMeter id={`${id}-rules`} password={props.value} />}
    </div>
  );
};

const PasswordMeter = ({ id, password }: { id: string; password: string }) => {
  const met = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const done = met === PASSWORD_RULES.length;

  if (!password)
    return (
      <p id={id} className="sr-only">
        Needs {missingRules(password)}
      </p>
    );

  return (
    <div className="mt-0.5 grid gap-2">
      <div aria-hidden className="flex gap-1">
        {PASSWORD_RULES.map((rule, i) => (
          <span
            key={rule.label}
            className={cn("h-1 flex-1 transition-colors", i < met ? (done ? "bg-ok" : "bg-ink") : "bg-tint")}
          />
        ))}
      </div>
      <p
        id={id}
        className={cn("flex items-center gap-1.5 font-body text-sm", done ? "text-ok" : "text-faded")}
      >
        {done ? (
          <>
            <Check className="size-4" strokeWidth={3} />
            Good to go
          </>
        ) : (
          `Still needs ${missingRules(password)}`
        )}
      </p>
    </div>
  );
};

export const FormError = ({ children }: { children: ReactNode }) => (
  <p
    role="alert"
    className="border-2 border-alert px-3 py-2.5 font-body text-[15px] font-semibold text-alert"
  >
    {children}
  </p>
);

interface SubmitProps {
  pending: boolean;
  filled?: boolean;
  className?: string;
  children: ReactNode;
}

export const SubmitButton = ({ pending, filled, className, children }: SubmitProps) => (
  <button
    type="submit"
    disabled={pending}
    className={cn(
      "label flex h-13 items-center justify-center gap-2 border-2 border-ink font-bold disabled:opacity-60",
      filled ? "bg-ink text-paper hover:bg-ink/85" : "hover:bg-ink hover:text-paper",
      className,
    )}
  >
    {children}
    {pending ? (
      <LoaderCircle className="size-4 animate-spin" />
    ) : (
      <ArrowRight className="size-4" strokeWidth={2.5} />
    )}
  </button>
);

export const TextButton = ({ className, ...props }: ComponentProps<"button">) => (
  <button
    type="button"
    className={cn("label underline underline-offset-3 hover:text-faded", className)}
    {...props}
  />
);
