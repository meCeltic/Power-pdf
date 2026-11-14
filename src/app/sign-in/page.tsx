import MaxWidthWrapper from "@/components/MaxWidthWrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "./actions"

const Page = ({ searchParams }: { searchParams: { next?: string; error?: string } }) => (
  <MaxWidthWrapper className="mb-12 mt-20 flex flex-col items-center text-center">
    <h1 className="text-3xl font-bold">Sign in to PowerPDF</h1>
    <p className="mt-2 text-zinc-700">No password needed. Enter your email to continue.</p>
    <form action={signIn} className="mt-8 flex w-full max-w-sm flex-col gap-3">
      <input type="hidden" name="next" value={searchParams.next ?? ""} />
      <Input name="email" type="email" required placeholder="you@example.com" />
      <Input name="name" type="text" placeholder="Name (optional)" />
      {searchParams.error ? <p className="text-sm text-red-600">Please enter a valid email.</p> : null}
      <Button type="submit">Continue</Button>
    </form>
  </MaxWidthWrapper>
)

export default Page
