import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'InviteMagic | Luxury Digital Wedding Invitations',
    short_name: 'InviteMagic',
    description: 'Create premium animated wedding invitation websites with interactive envelope unboxing, music, digital gift registry, and instant RSVP tracking.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d11',
    theme_color: '#d4af37',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
