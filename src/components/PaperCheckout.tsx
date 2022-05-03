import React from "react";
import "../../styles/PaperCheckout.module.css";

export enum PaperCheckoutDisplay {
	POPUP = "POPUP",
	NEW_TAB = "NEW_TAB",
	MODAL = "MODAL",
	DRAWER = "DRAWER",
	EMBED = "EMBED",
	UNIMPLEMENTED = "UNIMPLEMENTED",
}

interface PaperCheckoutProps {
	checkoutId: string;
	display?: PaperCheckoutDisplay;
	width?: number;
	height?: number;
	children?: React.ReactNode;
}

export const PaperCheckout: React.FC<PaperCheckoutProps> = ({
	checkoutId,
	display = PaperCheckoutDisplay.POPUP,
	width = 400,
	height = 800,
	children,
}) => {
	const checkoutUrl = `https://paper.xyz/checkout/${checkoutId}`;

	const clickableElement = children || (
		<button className="cta-button">Buy Now</button>
	);

	switch (display) {
		case PaperCheckoutDisplay.POPUP: {
			const onClick = () => {
				if (!window?.top) return;

				const y = window.top.outerHeight / 2 + window.top.screenY - height / 2;
				const x = window.top.outerWidth / 2 + window.top.screenX - width / 2;
				window.open(
					checkoutUrl,
					"Paper.xyz Checkout",
					`toolbar=no,
        location=no,
        status=no,
        menubar=no,
        scrollbars=yes,
        resizable=yes,
        width=${width},
        height=${height},
        top=${y},
        left=${x}`
				);
			};
			return <a onClick={onClick}>{clickableElement}</a>;
		}

		case PaperCheckoutDisplay.NEW_TAB: {
			const onClick = () => window.open(checkoutUrl, "_blank");
			return <a onClick={onClick}>{clickableElement}</a>;
		}

		case PaperCheckoutDisplay.MODAL: {
			return (
				<PaperCheckoutModal
					clickableElement={clickableElement}
					checkoutUrl={checkoutUrl}
					width={width}
					height={height}
				/>
			);
		}

		case PaperCheckoutDisplay.DRAWER: {
			return (
				<PaperCheckoutDrawer
					clickableElement={clickableElement}
					checkoutUrl={checkoutUrl}
					width={width}
				/>
			);
		}

		case PaperCheckoutDisplay.EMBED: {
			return <iframe src={checkoutUrl} width={width} height={height} />;
		}

		default:
			console.error(`Invalid or unimplemented display type: ${display}`);
			return <></>;
	}
};

const PaperCheckoutDrawer = ({
	clickableElement,
	checkoutUrl,
	width,
}: {
	clickableElement: React.ReactNode;
	checkoutUrl: string;
	width: number;
}) => {
	const onClick = () => {
		document.querySelector(".paper-overlay")?.classList.add("is-visible");
	};
	const onClickCloseButton = () => {
		document.querySelector(".paper-overlay")?.classList.remove("is-visible");
	};

	return (
		<>
			<a onClick={onClick}>{clickableElement}</a>

			<div className="paper-overlay paper-drawer">
				<div className="drawer-dialog">
					<button onClick={onClickCloseButton} className="modal-close-button">
						&times;
					</button>
					<iframe src={checkoutUrl} width={width} height="100%" />
				</div>
			</div>
		</>
	);
};

const PaperCheckoutModal = ({
	clickableElement,
	checkoutUrl,
	width,
	height,
}: {
	clickableElement: React.ReactNode;
	checkoutUrl: string;
	width: number;
	height: number;
}) => {
	const onClick = () => {
		document.querySelector(".paper-overlay")?.classList.add("is-visible");
	};
	const onClickCloseButton = () => {
		document.querySelector(".paper-overlay")?.classList.remove("is-visible");
	};

	return (
		<>
			<a onClick={onClick}>{clickableElement}</a>

			<div className="paper-overlay paper-modal">
				<div className="modal-dialog">
					<button onClick={onClickCloseButton} className="modal-close-button">
						&times;
					</button>
					<iframe src={checkoutUrl} width={width} height={height} />
				</div>
			</div>
		</>
	);
};
