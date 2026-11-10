import { Button } from "@/components/ui/button"
import { registerHref } from "@/lib/content"

// Sign in has no action yet. Wire it up here when the application portal exists.
export function SignInButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="ghost" size="lg" className={className}>
      Sign in
    </Button>
  )
}

// Until registration opens, Register takes people to the waitlist form.
export function RegisterButton({ className }: { className?: string }) {
  return (
    <Button size="lg" nativeButton={false} render={<a href={registerHref} />} className={className}>
      Register
    </Button>
  )
}
