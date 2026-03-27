import { useEffect, useRef, useState } from 'react';

export default function LazyMount({
    children,
    className = '',
    rootMargin = '300px 0px',
    fallback = null,
    minHeightClass = '',
    once = true,
}) {
    const hostRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!hostRef.current || (once && isVisible)) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const nextVisible = Boolean(entries[0]?.isIntersecting);

                if (once) {
                    if (!nextVisible) return;
                    setIsVisible(true);
                    observer.disconnect();
                    return;
                }

                setIsVisible(nextVisible);
            },
            { rootMargin, threshold: 0.01 }
        );

        observer.observe(hostRef.current);
        return () => observer.disconnect();
    }, [isVisible, once, rootMargin]);

    return (
        <div ref={hostRef} className={`${className} ${minHeightClass}`.trim()}>
            {isVisible ? children : fallback}
        </div>
    );
}
