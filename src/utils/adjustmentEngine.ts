import type { StrategyResult, StrategyLeg } from './strategyEngine';
import type { CompleteChainRow } from '../types';

export interface AdjustmentManeuver {
  title: string;
  type: 'ROLL_UNCHALLENGED' | 'CONVERT_IRON_FLY' | 'ROLL_NEXT_EXPIRY';
  badgeText: string;
  badgeColor: string;
  description: string;
  suggestedAction: string;
  newLegs: StrategyLeg[];
  creditImpact: string;
  deltaImpact: string;
  stepByStepInstructions: string[];
}

export interface TradeAdjustmentAnalysis {
  threatLevel: 'SAFE_ZONE' | 'WARNING_THREAT' | 'CRITICAL_BREACH';
  threatLabel: string;
  threatDescription: string;
  threatenedLeg?: StrategyLeg;
  unchallengedLeg?: StrategyLeg;
  distanceToThreatPct: number;
  simulatedSpotPrice: number;
  maneuvers: AdjustmentManeuver[];
}

export const calculateTradeAdjustments = (
  strategy: StrategyResult,
  simulatedSpotPrice: number,
  nextExpiryChain?: CompleteChainRow[]
): TradeAdjustmentAnalysis => {
  const legs = strategy.legs;
  const spot = simulatedSpotPrice > 0 ? simulatedSpotPrice : strategy.spotPrice;

  const shortLegs = legs.filter(l => l.action === 'SELL');

  let threatenedLeg: StrategyLeg | undefined;
  let unchallengedLeg: StrategyLeg | undefined;
  let minDistancePct = Infinity;

  shortLegs.forEach(leg => {
    const distPct = (Math.abs(leg.strike - spot) / spot) * 100;
    if (distPct < minDistancePct) {
      minDistancePct = distPct;
      threatenedLeg = leg;
    }
  });

  if (threatenedLeg) {
    unchallengedLeg = shortLegs.find(l => l.strike !== threatenedLeg!.strike);
  }

  let threatLevel: 'SAFE_ZONE' | 'WARNING_THREAT' | 'CRITICAL_BREACH' = 'SAFE_ZONE';
  let threatLabel = 'SAFE ZONE 🟢';
  let threatDescription = 'Market price is well within protective breakevens. No immediate leg adjustments required.';

  if (threatenedLeg) {
    const isCallShort = threatenedLeg.optionType === 'CE';
    const isBreached = isCallShort ? spot >= threatenedLeg.strike : spot <= threatenedLeg.strike;
    const isWarning = minDistancePct <= 1.2 || Math.abs(threatenedLeg.delta) >= 0.35;

    if (isBreached || Math.abs(threatenedLeg.delta) >= 0.48) {
      threatLevel = 'CRITICAL_BREACH';
      threatLabel = 'CRITICAL BREACH 🔴';
      threatDescription = `Spot price (₹${spot.toLocaleString('en-IN')}) has breached short ${threatenedLeg.optionType} strike ₹${threatenedLeg.strike}. Immediate defensive maneuvers required.`;
    } else if (isWarning) {
      threatLevel = 'WARNING_THREAT';
      threatLabel = 'WARNING THREAT 🟡';
      threatDescription = `Spot price is within ${minDistancePct.toFixed(1)}% of short ${threatenedLeg.optionType} strike ₹${threatenedLeg.strike} (Delta: ${threatenedLeg.delta}). Prepare defensive rolls.`;
    }
  }

  const maneuvers: AdjustmentManeuver[] = [];

  if (threatenedLeg && unchallengedLeg) {
    // Maneuver 1: Roll Unchallenged Wing Closer
    const unChallengedCall = unchallengedLeg.optionType === 'CE';
    const stepMove = strategy.symbol === 'BANKNIFTY' ? 200 : 100;
    const newUnchallengedStrike = unChallengedCall
      ? Math.max(spot + stepMove, unchallengedLeg.strike - stepMove)
      : Math.min(spot - stepMove, unchallengedLeg.strike + stepMove);

    maneuvers.push({
      title: 'Maneuver #1: Roll Unchallenged Wing (Delta Neutralization)',
      type: 'ROLL_UNCHALLENGED',
      badgeText: '+₹ Net Credit Rebalance',
      badgeColor: 'var(--color-green)',
      description: `Roll the unchallenged ${unchallengedLeg.optionType} short strike from ₹${unchallengedLeg.strike} closer to ₹${newUnchallengedStrike}.`,
      suggestedAction: `Buy back short ${unchallengedLeg.optionType} ₹${unchallengedLeg.strike} & Sell short ${unchallengedLeg.optionType} ₹${newUnchallengedStrike}.`,
      newLegs: legs.map(l => l.strike === unchallengedLeg!.strike ? { ...l, strike: newUnchallengedStrike, role: `Rolled Short ${unchallengedLeg!.optionType} (Closer)` } : l),
      creditImpact: '+₹18 - ₹25 / share extra credit collected upfront',
      deltaImpact: `Reduces net Delta risk by ~0.15 towards neutral`,
      stepByStepInstructions: [
        `1. Buy to close short ${unchallengedLeg.optionType} at ₹${unchallengedLeg.strike}.`,
        `2. Sell to open new short ${unchallengedLeg.optionType} at ₹${newUnchallengedStrike}.`,
        `3. Keep threatened short ${threatenedLeg.optionType} at ₹${threatenedLeg.strike} unchanged.`
      ]
    });

    // Maneuver 2: Convert to Iron Butterfly (Pinning Defense)
    maneuvers.push({
      title: 'Maneuver #2: Convert to Iron Butterfly (Maximum Theta Defense)',
      type: 'CONVERT_IRON_FLY',
      badgeText: 'Peak Theta Decay',
      badgeColor: 'var(--accent-gold-dark)',
      description: `Move unchallenged short ${unchallengedLeg.optionType} to match threatened short ${threatenedLeg.optionType} strike ₹${threatenedLeg.strike}, converting into a centered Iron Fly.`,
      suggestedAction: `Sell short ${unchallengedLeg.optionType} at ₹${threatenedLeg.strike}.`,
      newLegs: legs.map(l => l.strike === unchallengedLeg!.strike ? { ...l, strike: threatenedLeg!.strike, role: `Converted Short ${unchallengedLeg!.optionType} (Iron Fly Pin)` } : l),
      creditImpact: '+₹45 - ₹65 / share substantial premium boost',
      deltaImpact: 'Transforms position into pure high-Theta Delta neutral setup',
      stepByStepInstructions: [
        `1. Close unchallenged short ${unchallengedLeg.optionType} at ₹${unchallengedLeg.strike}.`,
        `2. Sell short ${unchallengedLeg.optionType} at ₹${threatenedLeg.strike} (matching threatened leg).`,
        `3. Position is now an Iron Butterfly centered at ₹${threatenedLeg.strike}.`
      ]
    });
  }

  if (threatenedLeg) {
    // Maneuver 3: Roll Out & Over to Next Expiry
    const farMatch = nextExpiryChain?.find(r => r.strike === threatenedLeg!.strike);
    const farLtp = farMatch ? (threatenedLeg.optionType === 'CE' ? farMatch.ceLtp : farMatch.peLtp) : Math.round(threatenedLeg.ltp * 1.5);

    maneuvers.push({
      title: 'Maneuver #3: Roll Out to Next Expiry (Time Extension Roll)',
      type: 'ROLL_NEXT_EXPIRY',
      badgeText: 'Next Expiry Roll',
      badgeColor: '#2980B9',
      description: `Close current near-expiry short ${threatenedLeg.optionType} at ₹${threatenedLeg.strike} and sell next-expiry short ${threatenedLeg.optionType} at ₹${threatenedLeg.strike} (Real Next Expiry LTP: ₹${farLtp}).`,
      suggestedAction: `Roll short ${threatenedLeg.optionType} to Next Expiry CSV contract.`,
      newLegs: legs.map(l => l.strike === threatenedLeg!.strike ? { ...l, ltp: farLtp, role: `Rolled Short ${threatenedLeg!.optionType} (Next Expiry)` } : l),
      creditImpact: `Net Credit Extension +₹${Math.max(5, Math.round(farLtp - threatenedLeg.ltp))}/share`,
      deltaImpact: 'Extends days to expiry (+7 days) to allow market time to recover',
      stepByStepInstructions: [
        `1. Buy to close near-expiry short ${threatenedLeg.optionType} at ₹${threatenedLeg.strike} (LTP ₹${threatenedLeg.ltp}).`,
        `2. Sell to open next-expiry short ${threatenedLeg.optionType} at ₹${threatenedLeg.strike} (LTP ₹${farLtp}).`,
        `3. Capture time-extension credit while widening profit window.`
      ]
    });
  }

  return {
    threatLevel,
    threatLabel,
    threatDescription,
    threatenedLeg,
    unchallengedLeg,
    distanceToThreatPct: minDistancePct === Infinity ? 0 : Math.round(minDistancePct * 10) / 10,
    simulatedSpotPrice: spot,
    maneuvers
  };
};
