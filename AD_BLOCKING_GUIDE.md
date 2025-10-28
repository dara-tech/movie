# Ad Blocking Guide for Streaming

This document explains the ad-blocking implementation for the streaming platform.

## Implementation Summary

### 1. CSS-Based Ad Blocking

We've added CSS rules to help block ads within the iframe containers:

**File: `client/src/index.css`**
- Added `.ad-block-wrapper` class with overflow prevention
- Blocks overlay ads and popup elements
- Hides common ad elements with specific IDs or classes containing "ad"
- Prevents clickjacking attempts

**Files:**
- `client/src/components/MoviePlayer.tsx` - Movie player wrapper
- `client/src/components/TvShowPlayer.tsx` - TV show player wrapper

Both players now use the `ad-block-wrapper` class to apply these styles.

### 2. Body Class Management

When a player is open, the `player-open` class is added to the body:
- Prevents popup windows
- Restricts overflow to prevent ad overlays
- Cleans up when the player closes

### 3. Redirect Prevention

We've implemented multiple layers of redirect prevention:

**Event Handlers:**
- `beforeunload` event handler prevents accidental navigation away from the player
- `popstate` event handler blocks browser back/forward button manipulation
- Window event listeners prevent popup windows

**Body Locking:**
- Sets `overflow: hidden` to prevent scroll hijacking
- Sets `position: fixed` to lock the page position
- Prevents unwanted navigation during video playback

**Iframe Protection:**
- Added `referrerPolicy="no-referrer-when-downgrade"` to limit referrer information
- Added `loading="lazy"` for better performance
- Configured proper `allow` attributes for security

## Limitations

**Important:** Due to cross-origin restrictions (CORS), we cannot directly access or manipulate content inside the iframe. The Vidsrc content loads from a different domain, which means:

1. We cannot block ads that are loaded inside the iframe itself
2. We can only prevent ads from appearing outside the iframe
3. Some ads may still appear within the Vidsrc player

## Recommended Solutions

### Option 1: Browser Extensions (RECOMMENDED)

Install a browser ad-blocking extension:

**For Chrome/Edge:**
- [uBlock Origin](https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm)
- [AdBlock Plus](https://chrome.google.com/webstore/detail/adblock-plus-free-ad-bloc/cfhdojbkjhnklbpkdaibdccddilifddb)

**For Firefox:**
- [uBlock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)
- [AdBlock Plus](https://addons.mozilla.org/en-US/firefox/addon/adblock-plus/)

**For Safari:**
- [AdGuard](https://adguard.com/en/adguard-safari/overview.html)

### Option 2: DNS-Based Ad Blocking

Configure your router or device to use an ad-blocking DNS service:

**Free Options:**
- [AdGuard DNS](https://adguard.com/en/adguard-dns/overview.html) - `94.140.14.14`
- [Cloudflare 1.1.1.3](https://1.1.1.1/dns/) - `1.1.1.3` (no-ads version)
- [Pi-hole](https://pi-hole.net/) - Self-hosted solution

**How to configure:**
1. Go to your network settings
2. Change DNS settings
3. Use one of the IP addresses above
4. This blocks ads network-wide

### Option 3: Alternative Vidsrc Domains

Some Vidsrc mirror domains may have fewer ads:
- `vidsrc.me`
- `vidsrc.icu`
- `vidsrc.to`

**Note:** Update the `VIDSRC_BASE_URL` in `server/services/vidsrcService.js` if you find a better domain.

### Option 4: Host-Based Ad Blocking (Advanced)

Add ad domains to your hosts file to block them system-wide.

**macOS/Linux:** `/etc/hosts`
**Windows:** `C:\Windows\System32\drivers\etc\hosts`

Add entries like:
```
0.0.0.0 doubleclick.net
0.0.0.0 googleadservices.com
0.0.0.0 googlesyndication.com
```

## Testing Ad Blocking

To verify if ads are blocked:

1. Open a movie or TV show
2. Check for:
   - No popup windows
   - No overlay banners
   - No redirection attempts
   - Clean video player interface

If you still see ads within the Vidsrc player, install a browser extension or use DNS-based blocking.

## Troubleshooting

### Ads still appearing:
1. Clear browser cache and cookies
2. Install uBlock Origin browser extension
3. Check if your ISP is serving ads (use VPN)
4. Try using a different browser

### Redirects still occurring:
1. **Check browser console** - Look for blocked popup messages
2. **Install browser ad blocker** - uBlock Origin offers strong resistance to redirects
3. **Check if inside Vidsrc** - If redirect is from clicking inside the iframe, that's expected
4. **Update your ad blocker** - Make sure filters are up to date
5. **Try incognito mode** - Test if extensions are interfering
6. **Check browser settings** - Ensure popup blockers are enabled

### Video not playing:
1. Disable ad blocker temporarily to test
2. Check browser console for errors
3. Try a different video
4. Ensure Vidsrc is not blocked

### Performance issues:
1. Whitelist Vidsrc domains in your ad blocker
2. Disable heavy browser extensions
3. Use hardware acceleration in browser settings

### Page navigation issues:
1. If you're being redirected away from the player, our `beforeunload` handler will try to warn you
2. Check the console for "Blocked potential popup" messages
3. Enable strict popup blocking in your browser
4. Consider using a dedicated streaming browser profile

## Support

If you encounter issues:
1. Check browser console for errors
2. Test with ad blocker disabled
3. Try different network (mobile hotspot)
4. Report specific domain or ad type

## Best Practices

1. **Use uBlock Origin** - Most effective and lightweight
2. **Keep it updated** - Ad blocking filters need regular updates
3. **Whitelist when needed** - Some sites require disabling for video
4. **Layer protection** - Use browser extension + DNS blocking together

## Important Notes

- We cannot guarantee 100% ad blocking due to cross-origin restrictions
- Some ads are served directly from video sources
- Ad blockers may occasionally need to be temporarily disabled
- Always respect content creators and legal streaming services
