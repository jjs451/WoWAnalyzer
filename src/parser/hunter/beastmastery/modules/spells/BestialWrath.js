import React from 'react';
import Analyzer from 'parser/core/Analyzer';
import SpellUsable from 'parser/shared/modules/SpellUsable';
import SPELLS from 'common/SPELLS';
import RESOURCE_TYPES from 'game/RESOURCE_TYPES';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import SpellIcon from 'common/SpellIcon';
import { formatNumber, formatPercentage } from 'common/format';
import SpellLink from 'common/SpellLink';
import ResourceIcon from 'common/ResourceIcon';
import Statistic from 'interface/statistics/Statistic';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import UptimeIcon from 'interface/icons/Uptime';

const COOLDOWN_REDUCTION_MS = 12000;
const BESTIAL_WRATH_BASE_CD = 90000;

/**
 * Sends you and your pet into a rage, increasing all damage you both deal by 25% for 15 sec.
 * Bestial Wrath's remaining cooldown is reduced by 12 sec each time you use Barbed Shot
 *
 * Example log: https://www.warcraftlogs.com/reports/pdm6qYNZ2ktMXDRr#fight=7&type=damage-done&source=8
 */
class BestialWrath extends Analyzer {
  static dependencies = {
    spellUsable: SpellUsable,
  };

  effectiveBWReduction = 0;
  wastedBWReduction = 0;
  casts = 0;
  accumulatedFocusAtBWCast = 0;

  on_byPlayer_cast(event) {
    const spellId = event.ability.guid;
    if (spellId === SPELLS.BESTIAL_WRATH.id) {
      this.casts += 1;
      if (event.classResources) {
        event.classResources.forEach(resource => {
          this.accumulatedFocusAtBWCast += resource.amount || 0;
        });
      }
      return;
    }
    if (spellId !== SPELLS.BARBED_SHOT.id) {
      return;
    }
    const bestialWrathIsOnCooldown = this.spellUsable.isOnCooldown(SPELLS.BESTIAL_WRATH.id);
    if (bestialWrathIsOnCooldown) {
      const reductionMs = this.spellUsable.reduceCooldown(SPELLS.BESTIAL_WRATH.id, COOLDOWN_REDUCTION_MS);
      this.effectiveBWReduction += reductionMs;
      this.wastedBWReduction += (COOLDOWN_REDUCTION_MS - reductionMs);
    } else {
      this.wastedBWReduction += COOLDOWN_REDUCTION_MS;
    }
  }

  get percentUptime() {
    return formatPercentage(this.selectedCombatant.getBuffUptime(SPELLS.BESTIAL_WRATH.id) / this.owner.fightDuration);
  }

  get gainedBestialWraths() {
    return (this.effectiveBWReduction / BESTIAL_WRATH_BASE_CD).toFixed(1);
  }

  get averageFocusAtBestialWrathCast() {
    return formatNumber(this.accumulatedFocusAtBWCast / this.casts);
  }

  get totalPossibleCDR() {
    return (this.wastedBWReduction + this.effectiveBWReduction);
  }

  get effectiveBestialWrathCDRPercent() {
    return this.effectiveBWReduction / this.totalPossibleCDR;
  }

  get focusOnBestialWrathCastThreshold() {
    if (this.selectedCombatant.hasTalent(SPELLS.KILLER_COBRA_TALENT.id)) {
      return {
        actual: this.averageFocusAtBestialWrathCast,
        isLessThan: {
          minor: 95,
          average: 85,
          major: 75,
        },
        style: 'number',
      };
    } else {
      return {
        actual: this.averageFocusAtBestialWrathCast,
        isLessThan: {
          minor: 85,
          average: 75,
          major: 65,
        },
        style: 'number',
      };
    }
  }

  get cdrEfficiencyBestialWrathThreshold() {
    return {
      actual: this.effectiveBWReduction / this.totalPossibleCDR,
      isLessThan: {
        minor: 0.95,
        average: 0.9,
        major: 0.85,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    when(this.focusOnBestialWrathCastThreshold).addSuggestion((suggest, actual, recommended) => {
      return suggest(<>You started your average <SpellLink id={SPELLS.BESTIAL_WRATH.id} /> at {this.averageFocusAtBestialWrathCast} focus, try and pool a bit more before casting <SpellLink id={SPELLS.BESTIAL_WRATH.id} />. This can be achieved by not casting abilities a few moments before <SpellLink id={SPELLS.BESTIAL_WRATH.id} /> comes off cooldown.</>)
        .icon(SPELLS.BESTIAL_WRATH.icon)
        .actual(`Average of ${this.averageFocusAtBestialWrathCast} focus at start of Bestial Wrath`)
        .recommended(`>${recommended} focus is recommended`);
    });
    when(this.cdrEfficiencyBestialWrathThreshold).addSuggestion((suggest, actual, recommended) => {
      return suggest(<>A crucial part of <SpellLink id={SPELLS.BARBED_SHOT.id} /> is the cooldown reduction of <SpellLink id={SPELLS.BESTIAL_WRATH.id} /> it provides. Therefore it's important to be casting <SpellLink id={SPELLS.BESTIAL_WRATH.id} /> as often as possible to ensure you'll be wasting as little potential cooldown reduction as possible.</>)
        .icon(SPELLS.BESTIAL_WRATH.icon)
        .actual(`You had ${formatPercentage(actual)}% effective cooldown reduction of Bestial Wrath`)
        .recommended(`>${formatPercentage(recommended)}% is recommended`);
    });
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(14)}
        size="flexible"
        dropdown={(
          <>
            <table className="table table-condensed">
              <thead>
                <tr>
                  <td className={"text-left"}><b>Statistic</b></td>
                  <td><b>Info</b></td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={"text-left"}>Average focus on cast</td>
                  <td><>{this.averageFocusAtBestialWrathCast} <ResourceIcon id={RESOURCE_TYPES.FOCUS.id} /></></td>
                </tr>
                <tr>
                  <td className={"text-left"}>Gained Bestial Wraths</td>
                  <td><>{this.gainedBestialWraths} <SpellIcon id={SPELLS.BESTIAL_WRATH.id} /></></td>
                </tr>
                <tr>
                  <td className={"text-left"}>CDR Efficiency</td>
                  <td><>{formatNumber(this.effectiveBWReduction / 1000)}s / {this.totalPossibleCDR / 1000}s</></td>
                </tr>
                <tr>
                  <td className={"text-left"}>CDR Efficiency %</td>
                  <td>{formatPercentage(this.effectiveBWReduction / this.totalPossibleCDR)}%</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      >
        <BoringSpellValueText spell={SPELLS.BESTIAL_WRATH}>
          <>
            <UptimeIcon /> {this.percentUptime}% <small>uptime</small>
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default BestialWrath;
