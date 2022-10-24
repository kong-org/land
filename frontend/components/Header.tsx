import Link from "next/link"; // Dynamic routing
import Image from "next/image"; // Images
import { eth } from "state/eth"; // Global state
import { useState } from "react"; // State management
import styles from "styles/components/Header.module.scss"; // Component styles

/**
 * Links to render in action menu
 * @dev Does not render any links where url is undefined, allowing conditional rendering
 */
const actionMenuLinks: {
  name: string;
  icon: string;
  url: string | undefined;
}[] = [
  {
    name: "About",
    icon: "/icons/info.svg",
    url: process.env.NEXT_PUBLIC_ARTICLE,
  },
  {
    name: "Discord",
    icon: "/icons/discord.svg",
    url: process.env.NEXT_PUBLIC_DISCORD,
  },
  {
    name: "Twitter",
    icon: "/icons/twitter.svg",
    url: process.env.NEXT_PUBLIC_TWITTER,
  },
  {
    name: "GitHub",
    icon: "/icons/github.svg",
    url: process.env.NEXT_PUBLIC_GITHUB,
  },
];

// Three dots image data (for second button)

export default function Header() {
  // Global state
  const { address, unlock }: { address: string | null; unlock: Function } =
    eth.useContainer();
  // Action menu open state
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className={styles.header}>
      {/* Logo */}
      <div className={styles.header__logo}>
        <Link href="/">
          <a>
            <img src="/icons/logo.svg" alt="Logo" />
          </a>
        </Link>
      </div>

      {/* Auth + details */}
      <div className={styles.header__actions}>
        {/* Unlock button */}
        <button className={styles.header__connect} onClick={() => unlock()}>
          {!address
            ? // If not connected, render connect wallet
              "Connect Wallet"
            : // Else, render address
              `${address.substr(0, 6)}...
                    ${address.slice(address.length - 4)}`}
        </button>

        {/* Actions button */}
        <button
          className={styles.header__menu}
          onClick={() => setMenuOpen((previous) => !previous)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <svg
            width="26"
            height="6"
            viewBox="0 0 26 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.5"
              y="0.5"
              width="5"
              height="5"
              rx="2.5"
              fill="currentColor"
            />
            <rect
              x="10.5"
              y="0.5"
              width="5"
              height="5"
              rx="2.5"
              fill="currentColor"
            />
            <rect
              x="20.5"
              y="0.5"
              width="5"
              height="5"
              rx="2.5"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      {menuOpen ? (
        // Render actions menu if open
        <div className={styles.header__actionMenu}>
          {actionMenuLinks.map(({ name, icon, url }, i) => {
            // For each link with a defined url
            return url ? (
              // Render action link containing name and image
              <a href={url} target="_blank" rel="noopener noreferrer" key={i}>
                <span>{name}</span>
                <Image src={icon} width={16} height={16} alt={`${name} icon`} />
              </a>
            ) : null;
          })}
        </div>
      ) : null}
    </div>
  );
}
