import { useEffect } from 'react';

export default function SEO({ title, description, keywords, image, url }) {
    useEffect(() => {
        if (title) {
            document.title = `${title} | EatGreet`;
        }

        const updateMeta = (name, content, attr = 'name') => {
            if (!content) return;
            let el = document.querySelector(`meta[${attr}="${name}"]`);
            if (el) {
                el.setAttribute('content', content);
            } else {
                const newMeta = document.createElement('meta');
                newMeta.setAttribute(attr, name);
                newMeta.setAttribute('content', content);
                document.head.appendChild(newMeta);
            }
        };

        updateMeta('description', description);
        updateMeta('keywords', keywords);
        
        // Open Graph
        updateMeta('og:title', title, 'property');
        updateMeta('og:description', description, 'property');
        if (image) updateMeta('og:image', image, 'property');
        if (url) updateMeta('og:url', url, 'property');

        // Twitter
        updateMeta('twitter:title', title);
        updateMeta('twitter:description', description);
        if (image) updateMeta('twitter:image', image);

    }, [title, description, keywords, image, url]);

    return null; // This component doesn't render anything
}
