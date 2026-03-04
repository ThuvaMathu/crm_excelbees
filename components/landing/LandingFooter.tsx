"use client";

import Link from "next/link";
import { LayoutDashboard, Twitter, Linkedin } from "lucide-react";
import { siteConfig } from "@/config/site";

export function LandingFooter() {
	const scrollToContact = () => {
		document.getElementById("enterprise-contact")?.scrollIntoView({
			behavior: "smooth",
		});
	};

	return (
		<footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
			<div className="container mx-auto px-4 md:px-6">
				<div className="grid md:grid-cols-4 gap-12 mb-12">
					{/* Brand */}
					<div className="col-span-1 md:col-span-2">
						<div className="flex items-center gap-2 mb-4">
							<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
								<LayoutDashboard className="h-5 w-5" />
							</div>
							<span className="text-xl font-bold text-white">{siteConfig.name}</span>
						</div>
						<p className="text-sm leading-relaxed max-w-sm mb-6">
							{siteConfig.tagline}
						</p>
						{/* Social Media - GitHub removed per requirements */}
						<div className="flex items-center gap-4">
							{siteConfig.social.twitter && (
								<Link
									href={siteConfig.social.twitter}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-primary transition-colors"
									aria-label="Twitter"
								>
									<Twitter className="h-5 w-5" />
								</Link>
							)}
							{siteConfig.social.linkedin && (
								<Link
									href={siteConfig.social.linkedin}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-primary transition-colors"
									aria-label="LinkedIn"
								>
									<Linkedin className="h-5 w-5" />
								</Link>
							)}
						</div>
					</div>

					{/* Product Links */}
					<div>
						<h4 className="font-bold text-white mb-6">Product</h4>
						<ul className="space-y-3 text-sm">
							{siteConfig.nav.footer.product.map((link) => (
								<li key={link.name}>
									<Link
										href={link.href}
										className="hover:text-primary transition-colors"
									>
										{link.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Company Links */}
					<div>
						<h4 className="font-bold text-white mb-6">Company</h4>
						<ul className="space-y-3 text-sm">
							{siteConfig.nav.footer.company.map((link) => (
								<li key={link.name}>
									{"action" in link && link.action === "scroll" ? (
										<button
											onClick={scrollToContact}
											className="hover:text-primary transition-colors text-left"
										>
											{link.name}
										</button>
									) : (
										<Link
											href={link.href}
											className="hover:text-primary transition-colors"
										>
											{link.name}
										</Link>
									)}
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
					<p>{siteConfig.legal.copyright}</p>
					<div className="flex gap-6">
						{siteConfig.nav.footer.legal.map((link) => (
							<Link
								key={link.name}
								href={link.href}
								className="hover:text-white"
							>
								{link.name}
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
