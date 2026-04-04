import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
