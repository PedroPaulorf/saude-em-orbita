import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  // Health7: alvo de toque de 44 px em todos os tamanhos; foco com contorno (regra global em index.css).
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-[15px] font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Amarelo: uma ação principal por tela.
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-hairline-strong bg-transparent text-ink hover:bg-surface-2",
        secondary: "border border-hairline bg-surface-2 text-ink hover:bg-surface-3",
        ghost: "text-ink hover:bg-surface-2",
        link: "text-interactive underline underline-offset-4",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        xs: "h-11 gap-1 px-2.5 text-sm",
        sm: "h-11 gap-1.5 px-3.5 text-sm has-[>svg]:px-3",
        lg: "h-12 px-6 has-[>svg]:px-5",
        icon: "size-11",
        "icon-xs": "size-11 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
