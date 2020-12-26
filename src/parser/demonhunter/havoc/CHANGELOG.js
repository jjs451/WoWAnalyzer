import React from 'react';
import { LeoZhekov, flurreN } from 'CONTRIBUTORS';
import { change, date } from 'common/changelog';
import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';

export default [
  change(date(2020, 12, 26, 'Legendary, Covenant and Conduits added for Havoc', [flurreN]),
  change(date(2020, 12, 26), <><SpellLink id={SPELLS.NETHERWALK_TALENT.id} /> and <SpellLink id={SPELLS.DARKNESS.id} /> now have a correct gcd.</>, flurreN),
  change(date(2020, 12, 24), 'Updated CDs and baselines for SL', [flurreN]),
  change(date(2020, 12, 23), 'Updated spells and talents for SL', [flurreN]),
  change(date(2020, 10, 30), 'Updated the deprecated StatisticBox elements with the new Statistic ones.', [LeoZhekov]),
];
