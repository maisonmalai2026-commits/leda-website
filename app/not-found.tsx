import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm text-accent-teal">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        This page wandered off.
      </h1>
      <p className="mt-3 max-w-md text-pretty text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist yet. Let&apos;s get you
        back to the workspace.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/workflows" variant="secondary">
          Explore workflows
        </ButtonLink>
      </div>
    </Container>
  );
}
