import Link from "next/link"
import { redirect } from "next/navigation"
import MaxWidthWrapper from "@/components/MaxWidthWrapper"
import AuthForm from "@/components/AuthForm"
import { getUser } from "@/lib/auth"
import { signUp } from "./actions"

const Page = async ({ searchParams }: { searchParams: { next?: string } }) => {
  if (await getUser()) redirect("/dashboard")
  const next = searchParams.next ?? ""
  const other = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"
  return (
    <MaxWidthWrapper className="mb-12 mt-20 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold">Create your PowerPDF account</h1>
      <p className="mt-2 text-zinc-700">Choose a password of at least 8 characters.</p>
      <AuthForm mode="sign-up" action={signUp} next={next} />
      <p className="mt-6 text-sm text-zinc-700">
        Already have an account?{" "}
        <Link href={other} className="font-semibold underline">Sign in</Link>
      </p>
    </MaxWidthWrapper>
  )
}

export default Page
