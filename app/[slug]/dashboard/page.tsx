'use client';

import { useMemo, useState } from 'react';
import { IconButton } from '@/shared/components/ui/buttons';
import { Icon } from '@/shared/components/ui/data-display';
import { Select } from '@/shared/components/ui/inputs';
import styles from './dashboard.module.css';

type Cohort = 'Cohort 2022' | 'Cohort 2023' | 'Cohort 2024';
type FundingPeriod = 'FY 2024' | 'FY 2025';

interface TrendPoint {
  term: string;
  gpa: number;
}

interface FundingSlice {
  key: string;
  label: string;
  color: string;
  valueMillions: number;
}

const termOrder = ['Fall 2022', 'Spring 2023', 'Fall 2023', 'Spring 2024', 'Fall 2024'];

const gpaByCohort: Record<Cohort, TrendPoint[]> = {
  'Cohort 2022': [
    { term: 'Fall 2022', gpa: 3.0 },
    { term: 'Spring 2023', gpa: 3.1 },
    { term: 'Fall 2023', gpa: 3.15 },
    { term: 'Spring 2024', gpa: 3.22 },
    { term: 'Fall 2024', gpa: 3.24 },
  ],
  'Cohort 2023': [
    { term: 'Fall 2022', gpa: 2.96 },
    { term: 'Spring 2023', gpa: 3.08 },
    { term: 'Fall 2023', gpa: 3.12 },
    { term: 'Spring 2024', gpa: 3.19 },
    { term: 'Fall 2024', gpa: 3.3 },
  ],
  'Cohort 2024': [
    { term: 'Fall 2022', gpa: 2.88 },
    { term: 'Spring 2023', gpa: 2.99 },
    { term: 'Fall 2023', gpa: 3.04 },
    { term: 'Spring 2024', gpa: 3.12 },
    { term: 'Fall 2024', gpa: 3.21 },
  ],
};

const fundingByPeriod: Record<FundingPeriod, FundingSlice[]> = {
  'FY 2024': [
    { key: 'merit', label: 'Merit-Based', color: '#8B5CF6', valueMillions: 10.8 },
    { key: 'need', label: 'Need-Based', color: '#10B981', valueMillions: 9.4 },
    { key: 'departmental', label: 'Departmental', color: '#3B82F6', valueMillions: 4.0 },
    { key: 'other', label: 'Other', color: '#6B7280', valueMillions: 2.8 },
  ],
  'FY 2025': [
    { key: 'merit', label: 'Merit-Based', color: '#8B5CF6', valueMillions: 11.2 },
    { key: 'need', label: 'Need-Based', color: '#10B981', valueMillions: 9.9 },
    { key: 'departmental', label: 'Departmental', color: '#3B82F6', valueMillions: 4.4 },
    { key: 'other', label: 'Other', color: '#6B7280', valueMillions: 3.1 },
  ],
};

export default function Dashboard() {
  const [primaryCohort, setPrimaryCohort] = useState<Cohort>('Cohort 2023');
  const [secondaryCohort, setSecondaryCohort] = useState<Cohort>('Cohort 2024');
  const [fundingPeriod, setFundingPeriod] = useState<FundingPeriod>('FY 2025');

  const getCohortSeries = (cohort: Cohort): TrendPoint[] => {
    switch (cohort) {
      case 'Cohort 2022':
        return gpaByCohort['Cohort 2022'];
      case 'Cohort 2023':
        return gpaByCohort['Cohort 2023'];
      case 'Cohort 2024':
        return gpaByCohort['Cohort 2024'];
      default:
        return gpaByCohort['Cohort 2023'];
    }
  };

  const getFundingSeries = (period: FundingPeriod): FundingSlice[] => {
    switch (period) {
      case 'FY 2024':
        return fundingByPeriod['FY 2024'];
      case 'FY 2025':
        return fundingByPeriod['FY 2025'];
      default:
        return fundingByPeriod['FY 2025'];
    }
  };

  const primarySeries = getCohortSeries(primaryCohort);
  const secondarySeries = getCohortSeries(secondaryCohort);
  const fundingSeries = getFundingSeries(fundingPeriod);

  const yTicks = useMemo(() => [2.8, 3.0, 3.2, 3.4], []);

  const chartGeometry = useMemo(() => {
    const width = 640;
    const height = 250;
    const left = 36;
    const right = 16;
    const top = 10;
    const bottom = 44;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;

    const allValues = [...primarySeries.map((point) => point.gpa), ...secondarySeries.map((point) => point.gpa)];
    const min = Math.min(...allValues, 2.8);
    const max = Math.max(...allValues, 3.4);

    const x = (index: number) =>
      left + (termOrder.length === 1 ? innerWidth / 2 : (index / (termOrder.length - 1)) * innerWidth);

    const y = (value: number) => {
      const safeRange = max - min || 1;
      return top + ((max - value) / safeRange) * innerHeight;
    };

    const getPath = (series: TrendPoint[]) =>
      series.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.gpa)}`).join(' ');

    return { width, height, left, right, top, bottom, x, y, getPath };
  }, [primarySeries, secondarySeries]);

  const totalFunding = useMemo(
    () => fundingSeries.reduce((sum, slice) => sum + slice.valueMillions, 0),
    [fundingSeries],
  );

  const donutGradient = useMemo(() => {
    const segments = fundingSeries.reduce<{ progress: number; items: string[] }>(
      (accumulator, slice) => {
        const start = accumulator.progress;
        const end = start + (slice.valueMillions / totalFunding) * 100;
        return {
          progress: end,
          items: [...accumulator.items, `${slice.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`],
        };
      },
      { progress: 0, items: [] },
    );
    return `conic-gradient(${segments.items.join(', ')})`;
  }, [fundingSeries, totalFunding]);

  const cohortOptions: Cohort[] = ['Cohort 2022', 'Cohort 2023', 'Cohort 2024'];
  const periodOptions: FundingPeriod[] = ['FY 2024', 'FY 2025'];
  const cohortSelectOptions = cohortOptions.map((value) => ({ value, label: value }));
  const periodSelectOptions = periodOptions.map((value) => ({ value, label: value }));

  const parseCohort = (value: string): Cohort => {
    switch (value) {
      case 'Cohort 2022':
      case 'Cohort 2023':
      case 'Cohort 2024':
        return value;
      default:
        return 'Cohort 2023';
    }
  };

  const parsePeriod = (value: string): FundingPeriod => {
    switch (value) {
      case 'FY 2024':
      case 'FY 2025':
        return value;
      default:
        return 'FY 2025';
    }
  };

  const readSelectValue = (event: Event): string => {
    const target = event.target as EventTarget & { value?: string };
    const currentTarget = event.currentTarget as EventTarget & { value?: string };
    return target.value ?? currentTarget.value ?? '';
  };

  return (
    <div className={styles.dashboardRoot}>
      <header className={styles.header}>
        <h1 className={styles.title}>ScholarTrack Hub: Scholarship Monitoring Dashboard</h1>
        <IconButton variant="filled-tonal" className={styles.iconButton} aria-label="Notifications">
          <Icon slot="icon" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>
            notifications
          </Icon>
        </IconButton>
      </header>

      <section className={styles.summaryCards}>
        <div className={styles.card}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Active Scholars</span>
            <span className={styles.cardValue}>1,245</span>
          </div>
          <div
            className={styles.iconWrapper}
            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}
          >
            <Icon>group</Icon>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Applications Reviewing</span>
            <span className={styles.cardValue}>310</span>
          </div>
          <div
            className={styles.iconWrapper}
            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}
          >
            <Icon>description</Icon>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Total Funds Allocated</span>
            <span className={styles.cardValue}>$15.6M</span>
          </div>
          <div
            className={styles.iconWrapper}
            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}
          >
            <Icon>attach_money</Icon>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Upcoming Renewals</span>
            <span className={styles.cardValue}>45</span>
          </div>
          <div
            className={styles.iconWrapper}
            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}
          >
            <Icon>sync</Icon>
          </div>
        </div>
      </section>

      <section className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h2 className={styles.chartTitle}>Scholar Performance Overview</h2>
              <span className={styles.cardLabel}>Average GPA Trends</span>
            </div>
            <div className={styles.controls}>
              <Select
                outlined
                className={styles.chartSelect}
                label="Primary"
                value={primaryCohort}
                options={cohortSelectOptions}
                onInput={(event: Event) => {
                  setPrimaryCohort(parseCohort(readSelectValue(event)));
                }}
              />
              <Select
                outlined
                className={styles.chartSelect}
                label="Compare"
                value={secondaryCohort}
                options={cohortSelectOptions}
                onInput={(event: Event) => {
                  setSecondaryCohort(parseCohort(readSelectValue(event)));
                }}
              />
            </div>
          </div>

          <div className={styles.lineChartArea}>
            <svg className={styles.chartSvg} viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}>
              {yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={chartGeometry.left}
                    y1={chartGeometry.y(tick)}
                    x2={chartGeometry.width - chartGeometry.right}
                    y2={chartGeometry.y(tick)}
                    className={styles.gridLine}
                  />
                  <text x={4} y={chartGeometry.y(tick) + 3} className={styles.axisLabel}>
                    {tick.toFixed(1)}
                  </text>
                </g>
              ))}

              <path d={chartGeometry.getPath(primarySeries)} className={styles.primaryLine} />
              <path d={chartGeometry.getPath(secondarySeries)} className={styles.secondaryLine} />

              {primarySeries.map((point, index) => (
                <circle
                  key={`p-${point.term}`}
                  cx={chartGeometry.x(index)}
                  cy={chartGeometry.y(point.gpa)}
                  r={4.5}
                  className={styles.primaryDot}
                />
              ))}
              {secondarySeries.map((point, index) => (
                <circle
                  key={`s-${point.term}`}
                  cx={chartGeometry.x(index)}
                  cy={chartGeometry.y(point.gpa)}
                  r={4.5}
                  className={styles.secondaryDot}
                />
              ))}
            </svg>

            <div className={styles.axisTerms}>
              {termOrder.map((term) => (
                <span key={term}>{term}</span>
              ))}
            </div>

            <div className={styles.seriesLegend}>
              <span>
                <i className={`${styles.legendSwatch} ${styles.primarySwatch}`} />
                {primaryCohort}
              </span>
              <span>
                <i className={`${styles.legendSwatch} ${styles.secondarySwatch}`} />
                {secondaryCohort}
              </span>
            </div>
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Funding Allocation by Type</h2>
            <Select
              outlined
              className={styles.chartSelect}
              label="Period"
              value={fundingPeriod}
              options={periodSelectOptions}
              onInput={(event: Event) => {
                setFundingPeriod(parsePeriod(readSelectValue(event)));
              }}
            />
          </div>

          <div className={styles.donutContainer}>
            <div className={styles.donutChart} style={{ background: donutGradient }}>
              <div className={styles.donutHole}>
                <span className={styles.donutTotal}>${totalFunding.toFixed(1)}M</span>
                <span className={styles.donutHint}>Total</span>
              </div>
            </div>

            <div className={styles.donutLegend}>
              {fundingSeries.map((slice) => {
                const percentage = Math.round((slice.valueMillions / totalFunding) * 100);
                return (
                  <div className={styles.legendItem} key={slice.key}>
                    <div className={styles.legendDot} style={{ background: slice.color }} />
                    <div className={styles.legendText}>
                      <span className={styles.legendLabel}>{slice.label}</span>
                      <span className={styles.legendValue}>
                        ${slice.valueMillions.toFixed(1)}M, {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </section>

      <section className={styles.tablesGrid}>
        <article className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Recent Application Status</h2>
            <button className={styles.viewAll}>View All</button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>EM</div>
                      Elena Martinez
                    </div>
                  </td>
                  <td>Computer Science</td>
                  <td>
                    <span className={`${styles.badge} ${styles.reviewing}`}>Reviewing</span>
                  </td>
                  <td>Oct 24, 2024</td>
                </tr>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>JW</div>
                      James Wilson
                    </div>
                  </td>
                  <td>Business Admin</td>
                  <td>
                    <span className={`${styles.badge} ${styles.approved}`}>Approved</span>
                  </td>
                  <td>Oct 23, 2024</td>
                </tr>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>SJ</div>
                      Sarah Jenkins
                    </div>
                  </td>
                  <td>Engineering</td>
                  <td>
                    <span className={`${styles.badge} ${styles.reviewing}`}>Reviewing</span>
                  </td>
                  <td>Oct 22, 2024</td>
                </tr>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>MT</div>
                      Michael Tran
                    </div>
                  </td>
                  <td>Arts & Humanities</td>
                  <td>
                    <span className={`${styles.badge} ${styles.missing}`}>Missing Docs</span>
                  </td>
                  <td>Oct 21, 2024</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Scholar Document Tracking</h2>
            <button className={styles.viewAll}>View All</button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Scholar</th>
                  <th>Document Type</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>AK</div>
                      Aisha Khan
                    </div>
                  </td>
                  <td>Transcript</td>
                  <td>
                    <span className={`${styles.badge} ${styles.submitted}`}>Submitted</span>
                  </td>
                  <td>Nov 01, 2024</td>
                </tr>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>DR</div>
                      David Rodriguez
                    </div>
                  </td>
                  <td>Recommendation</td>
                  <td>
                    <span className={`${styles.badge} ${styles.missing}`}>Missing</span>
                  </td>
                  <td>Oct 30, 2024</td>
                </tr>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>LC</div>
                      Lin Chen
                    </div>
                  </td>
                  <td>Progress Report</td>
                  <td>
                    <span className={`${styles.badge} ${styles.approved}`}>Approved</span>
                  </td>
                  <td>Nov 15, 2024</td>
                </tr>
                <tr>
                  <td>
                    <div className={styles.avatarName}>
                      <div className={styles.avatar}>MP</div>
                      Marcus Patel
                    </div>
                  </td>
                  <td>Financial Aid</td>
                  <td>
                    <span className={`${styles.badge} ${styles.submitted}`}>Submitted</span>
                  </td>
                  <td>Nov 05, 2024</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
