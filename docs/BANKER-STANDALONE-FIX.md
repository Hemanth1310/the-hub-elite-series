# Banker/Conviction Fix for Standalone Matches

**Version:** A87
**Date:** January 2025

## Issue
When in standalone mode, the banker/conviction button should be disabled since standalone matches don't allow banker selection.

## Fix Applied

### V1 - Complete ✅
- Updated instructions to conditionally show banker info
- Disabled banker button when `prototypeRoundType === 'standalone'`
- Updated lock validation to not require banker in standalone mode

### V2 - Complete ✅
- Updated instructions to conditionally show banker info
- Disabled banker button (mobile & desktop) when `prototypeRoundType === 'standalone'`
- Updated lock validation to not require banker in standalone mode

### V3 - Partial ⚠️
- Updated instructions
- **TODO:** Need to disable banker button (check for all instances)
- **TODO:** Need to update lock validation

## Code Pattern

```tsx
// Instructions
{prototypeRoundType === 'regular' ? (
  <>Banker text</>
) : (
  <span className="text-slate-500"> Banker not available for standalone.</span>
)}

// Banker Button
<Button
  className={`... ${prototypeRoundType === 'standalone' ? 'opacity-30 cursor-not-allowed' : ''}`}
  disabled={isLocked || !pred?.prediction || isManuallyLocked || prototypeRoundType === 'standalone'}
>
  <Star ... />
</Button>

// Lock Validation
disabled={prototypeRoundType === 'regular' && !hasBanker}
```

##Summary Added to DATABASE-CHANGELOG
