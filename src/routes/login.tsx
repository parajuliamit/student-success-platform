import {
	createFileRoute,
	Link,
	Navigate,
	useNavigate,
} from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAuth } from "#/features/auth/auth-provider";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { login, status } = useAuth();
	const [username, setUsername] = useState("admin");
	const [password, setPassword] = useState("Admin123!");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (status === "authenticated") {
		return <Navigate to="/dashboard" />;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			await login({ username, password });
			await navigate({ to: "/dashboard" });
		} catch (submissionError) {
			setError(
				submissionError instanceof Error
					? submissionError.message
					: "Unable to sign in right now.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="relative mx-auto flex min-h-svh w-full items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(79,184,178,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(47,106,74,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(231,243,236,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(79,184,178,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(47,106,74,0.12),transparent_30%),linear-gradient(180deg,rgba(8,18,22,0.96),rgba(10,20,24,0.92))]" />
			<div className="w-full max-w-md">
				<section className="flex items-center">
					<Card className="w-full rounded-3xl border-[color-mix(in_oklch,var(--border),white_12%)] bg-[var(--surface-strong)] shadow-[0_24px_80px_rgba(15,45,40,0.16)] backdrop-blur-xl">
						<CardHeader className="space-y-2 pb-4">
							<CardTitle className="text-2xl">Welcome back</CardTitle>
							<CardDescription className="text-sm">
								Sign in with your platform credentials to continue.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="space-y-4" onSubmit={handleSubmit}>
								<div className="space-y-2">
									<Label htmlFor="username">Username</Label>
									<Input
										id="username"
										value={username}
										onChange={(event) => setUsername(event.target.value)}
										autoComplete="username"
										placeholder="admin"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										autoComplete="current-password"
										placeholder="••••••••"
									/>
								</div>
								{error ? (
									<div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
										<AlertTriangle className="mt-0.5 size-4 shrink-0" />
										<p>{error}</p>
									</div>
								) : null}
								<Button
									type="submit"
									className="h-11 w-full rounded-xl text-sm"
									disabled={isSubmitting}
								>
									{isSubmitting ? "Signing in..." : "Sign in"}
									<ArrowRight className="ml-2 size-4" />
								</Button>
								<div className="text-right text-sm text-muted-foreground pr-1">
									<Link to="/about" className="font-semibold">
										Learn more
									</Link>
								</div>
								
							</form>
						</CardContent>
					</Card>
				</section>
			</div>
		</main>
	);
}
