'use client';

import { showElementById } from '@/shared/utils';
import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CatalogCard,
  Checkbox,
  Chips,
  CircularProgress,
  ComplexSubmenuDemo,
  DataDisplayDemos,
  DatePicker,
  Divider,
  ExtendedFab,
  Fab,
  FabMenu,
  FabMenuItem,
  Icon,
  IconButton,
  LinearProgress,
  List,
  Menu,
  OverlayDemos,
  PrimaryTab,
  Radio,
  SecondaryTab,
  Section,
  SegmentedButton,
  SegmentedButtonSet,
  Select,
  SimpleMenuDemo,
  Slider,
  SplitButton,
  Switch,
  Tabs,
  TextField,
  TimePicker,
  Toolbar,
} from '@/shared/components/ui';
import { AlertSnackbar } from './feedback/AlertSnackbar';

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function AllMaterialComponents() {
  const handleToolbarAction = () => undefined;
  const [showPrimaryAlert, setShowPrimaryAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(true);
  const [showFixedToolbar, setShowFixedToolbar] = useState(true);
  const [floatingPosition, setFloatingPosition] = useState<'bottom' | 'top' | 'left' | 'right'>(
    'bottom',
  );
  const [fixedPosition, setFixedPosition] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom');
  const [floatingColor, setFloatingColor] = useState<
    'primary' | 'secondary' | 'tertiary' | 'surface'
  >('surface');
  const [fixedColor, setFixedColor] = useState<'primary' | 'secondary' | 'tertiary' | 'surface'>(
    'surface',
  );

  return (
    <div className="catalog-container">
      {/* HEADER */}
      <header className="catalog-header">
        <div className="catalog-header-content">
          <h1 className="catalog-title">Material Design 3</h1>
          <p className="catalog-subtitle">
            Complete high-fidelity component catalog. Built with modern React and MD3 Web.
          </p>
        </div>
      </header>

      {/* ACTIONS SECTION */}
      <Section title="Actions & Buttons">
        <CatalogCard title="Common Buttons">
          <div className="flex-wrap-center" style={{ gap: '16px' }}>
            <Button variant="filled">Filled</Button>
            <Button variant="tonal">Tonal</Button>
            <Button variant="elevated">Elevated</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
          </div>
        </CatalogCard>

        <CatalogCard title="Floating Action Buttons">
          <div className="flex-wrap-center" style={{ gap: '24px' }}>
            <Fab variant="primary">
              <Icon slot="icon">add</Icon>
            </Fab>
            <Fab variant="secondary" size="small">
              <Icon slot="icon">edit</Icon>
            </Fab>
            <Fab variant="tertiary" size="large">
              <Icon slot="icon">palette</Icon>
            </Fab>
            <ExtendedFab label="Create New">
              <Icon slot="icon">add</Icon>
            </ExtendedFab>
            <Fab
              style={
                {
                  '--md-fab-container-color': 'var(--md-sys-color-primary-container)',
                } as React.CSSProperties
              }
            >
              <Icon
                slot="icon"
                style={{ color: 'var(--md-sys-color-on-primary-container)' } as React.CSSProperties}
              >
                auto_awesome
              </Icon>
            </Fab>
          </div>
        </CatalogCard>

        <CatalogCard title="Icon Buttons & Split">
          <div className="flex-wrap-center" style={{ gap: '16px' }}>
            <IconButton>
              <Icon>favorite</Icon>
            </IconButton>
            <IconButton>
              <Icon>share</Icon>
            </IconButton>
            <IconButton>
              <Icon>settings</Icon>
            </IconButton>
            <SplitButton
              onMainClick={() => {
                /* SplitButton demo click */
              }}
              variant="filled"
            >
              Split Option
            </SplitButton>
          </div>
        </CatalogCard>

        <CatalogCard title="Segmented Buttons">
          <div className="flex-wrap-center">
            <SegmentedButtonSet>
              <SegmentedButton label="Day" />
              <SegmentedButton label="Week" selected />
              <SegmentedButton label="Month" />
            </SegmentedButtonSet>
          </div>
        </CatalogCard>

        <CatalogCard
          title="Fab Speed Dial"
          style={
            { minHeight: '300px', display: 'flex', alignItems: 'center' } as React.CSSProperties
          }
        >
          <div className="flex-wrap-center" style={{ paddingBottom: '2rem' }}>
            <FabMenu icon="share" variant="tertiary">
              <FabMenuItem icon="mail" label="Email" />
              <FabMenuItem icon="chat" label="Chat" />
              <FabMenuItem icon="call" label="Call" />
            </FabMenu>
          </div>
        </CatalogCard>
      </Section>

      <Section title="Communication & Data Display">
        <CatalogCard title="Progress Indicators">
          <div className="flex-col-centered">
            <LinearProgress value={0.7} />
            <LinearProgress indeterminate />
            <div className="flex-wrap-center" style={{ gap: '2rem' }}>
              <CircularProgress value={0.4} />
              <CircularProgress indeterminate />
            </div>
          </div>
        </CatalogCard>

        <CatalogCard title="Badges & Icons">
          <div className="flex-wrap-center" style={{ gap: '2rem' }}>
            <div className="badge-wrapper">
              <Icon style={{ fontSize: '2rem' }}>notifications</Icon>
              <Badge count="99+" />
            </div>
            <div className="badge-wrapper">
              <Icon style={{ fontSize: '1.75rem' }}>mail</Icon>
              <div className="badge-dot" />
            </div>
            <Icon>verified</Icon>
            <Icon>bolt</Icon>
          </div>
        </CatalogCard>

        <CatalogCard title="List Patterns">
          <div className="list-container-surface">
            <List>
              <div className="list-item-flex">
                <Icon>folder</Icon>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>Photos</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Jan 9, 2024</div>
                </div>
                <IconButton>
                  <Icon>more_vert</Icon>
                </IconButton>
              </div>
              <Divider />
              <div className="list-item-flex">
                <Icon>work</Icon>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>Work Docs</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Jan 7, 2024</div>
                </div>
                <IconButton>
                  <Icon>more_vert</Icon>
                </IconButton>
              </div>
            </List>
          </div>
        </CatalogCard>
      </Section>

      {/* INPUTS & SELECTION */}
      <Section title="Inputs & Selection">
        <CatalogCard title="Selection Controls">
          <div className="flex-col-gap-3">
            <label className="field-label">
              <Checkbox checked /> <span>Accept Terms</span>
            </label>
            <label className="field-label">
              <Radio name="opt" checked /> <span>Option A</span>
            </label>
            <label className="field-label">
              <Switch selected /> <span>System Active</span>
            </label>
            <Slider value={45} labeled ticks />
          </div>
        </CatalogCard>

        <CatalogCard title="Chips & Variants">
          <div className="flex-wrap-center" style={{ gap: '12px' }}>
            <Chips label="Infrastructure" variant="assist" />
            <Chips label="Active" variant="filter" selected />
            <Chips label="Pending" variant="suggestion" />
            <Chips label="User.tag" variant="input" removable />
          </div>
        </CatalogCard>

        <CatalogCard title="Text Fields & Select">
          <div className="flex-col-gap-3" style={{ maxWidth: '400px' }}>
            <TextField label="Username" variant="outlined" placeholder="john_doe" />
            <TextField label="Password" variant="filled" type="password" />
            <Select
              label="Environment"
              options={[
                { label: 'Production', value: 'prod' },
                { label: 'Staging', value: 'stage' },
                { label: 'Development', value: 'dev' },
              ]}
            />
          </div>
        </CatalogCard>

        <CatalogCard title="Date & Time Pickers">
          <div className="flex-col-gap-3">
            <DatePicker label="Pick a Date" />
            <TimePicker label="Pick a Time" />
          </div>
        </CatalogCard>
      </Section>

      {/* NAVIGATION & SURFACES */}
      <Section title="Navigation & Surfaces">
        <CatalogCard title="Cards & Containers">
          <div className="flex-wrap-center" style={{ gap: '20px' }}>
            <Card variant="elevated" style={{ width: '140px', height: '100px' }}>
              Elevated
            </Card>
            <Card variant="filled" style={{ width: '140px', height: '100px' }}>
              Filled
            </Card>
            <Card variant="outlined" style={{ width: '140px', height: '100px' }}>
              Outlined
            </Card>
          </div>
        </CatalogCard>

        <CatalogCard title="Tabs">
          <div style={{ width: '100%' }}>
            <Tabs>
              <PrimaryTab selected>Overview</PrimaryTab>
              <PrimaryTab>Specs</PrimaryTab>
              <PrimaryTab>Guides</PrimaryTab>
            </Tabs>
            <div style={{ marginTop: '16px' }}>
              <Tabs>
                <SecondaryTab selected>Metric</SecondaryTab>
                <SecondaryTab>Imperial</SecondaryTab>
              </Tabs>
            </div>
          </div>
        </CatalogCard>

        <CatalogCard title="Overlays & Triggers">
          <div className="flex-wrap-center" style={{ gap: '16px' }}>
            <Button variant="filled" onClick={() => showElementById('catalog-dialog')}>
              Open Dialog
            </Button>
            <div style={{ position: 'relative' }}>
              <IconButton id="menu-trigger" onClick={() => showElementById('catalog-menu')}>
                <Icon>more_vert</Icon>
              </IconButton>
              <Menu anchor="menu-trigger" id="catalog-menu">
                <div style={{ padding: '12px 24px', cursor: 'pointer' }}>Settings</div>
                <div style={{ padding: '12px 24px', cursor: 'pointer' }}>Help & Feedback</div>
                <Divider />
                <div
                  style={{
                    padding: '12px 24px',
                    cursor: 'pointer',
                    color: 'var(--md-sys-color-error)',
                  }}
                >
                  Logout
                </div>
              </Menu>
            </div>
          </div>
        </CatalogCard>
      </Section>

      <Section title="Sheets">
        <CatalogCard title="Bottom sheets">
          <div className="flex-wrap-center" style={{ gap: '16px' }}>
            <Button variant="filled" onClick={() => showElementById('catalog-sheet')}>
              Open Sheet
            </Button>
          </div>
        </CatalogCard>
        <CatalogCard title="Side sheets">
          <div className="flex-wrap-center" style={{ gap: '16px' }}>
            <Button variant="filled" onClick={() => showElementById('stepped-sheet-demo')}>
              Open Form
            </Button>
          </div>
        </CatalogCard>
      </Section>

      <OverlayDemos />

      <Section title="Carousel">
        <div className="catalog-grid-full">
          <DataDisplayDemos />
        </div>
      </Section>
      {/* Add submenu component */}
      <Section title="Menus and Submenus (fixed)">
        <CatalogCard title="Simple Menu">
          <div className="menu-demo-card-content">
            <SimpleMenuDemo />
          </div>
        </CatalogCard>
        <CatalogCard title="Complex Submenu" style={{ overflow: 'visible' } as React.CSSProperties}>
          <div className="complex-menu-demo-card-content">
            <ComplexSubmenuDemo />
          </div>
        </CatalogCard>
      </Section>

      {/* Alert snackbar */}
      <Section title="Alert snack">
        <CatalogCard title="Alert">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="filled" onClick={() => setShowPrimaryAlert(true)}>
              Show Primary Alert
            </Button>
            <Button variant="filled" onClick={() => setShowErrorAlert(true)}>
              Show Error Alert
            </Button>
            <Button variant="filled" onClick={() => setShowSuccessAlert(true)}>
              Show Success Alert
            </Button>
          </div>

          <AlertSnackbar
            open={showPrimaryAlert}
            icon="notifications"
            description="This is a primary notification message"
            color="primary"
            position="bottom-center"
            onClose={() => setShowPrimaryAlert(false)}
          />

          <AlertSnackbar
            open={showErrorAlert}
            icon="error"
            description="This is an error notification message"
            color="error"
            position="top-right"
            onClose={() => setShowErrorAlert(false)}
          />

          <AlertSnackbar
            open={showSuccessAlert}
            icon="check_circle"
            description="This is a success notification message"
            color="success"
            position="bottom-left"
            onClose={() => setShowSuccessAlert(false)}
          />
        </CatalogCard>
      </Section>
      {/* Toolbar component */}
      <Section title="Toolbar">
        <CatalogCard title="Floating Toolbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Visibility Control */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button variant="filled" onClick={() => setShowFloatingToolbar(!showFloatingToolbar)}>
                {showFloatingToolbar ? 'Hide' : 'Show'} Floating Toolbar
              </Button>
            </div>

            {/* Position Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px' }}>Position:</span>
              <Button
                variant={floatingPosition === 'top' ? 'filled' : 'outlined'}
                onClick={() => setFloatingPosition('top')}
              >
                Top
              </Button>
              <Button
                variant={floatingPosition === 'bottom' ? 'filled' : 'outlined'}
                onClick={() => setFloatingPosition('bottom')}
              >
                Bottom
              </Button>
              <Button
                variant={floatingPosition === 'left' ? 'filled' : 'outlined'}
                onClick={() => setFloatingPosition('left')}
              >
                Left
              </Button>
              <Button
                variant={floatingPosition === 'right' ? 'filled' : 'outlined'}
                onClick={() => setFloatingPosition('right')}
              >
                Right
              </Button>
            </div>

            {/* Color Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px' }}>Color:</span>
              <Button
                variant={floatingColor === 'primary' ? 'filled' : 'outlined'}
                onClick={() => setFloatingColor('primary')}
              >
                Primary
              </Button>
              <Button
                variant={floatingColor === 'secondary' ? 'filled' : 'outlined'}
                onClick={() => setFloatingColor('secondary')}
              >
                Secondary
              </Button>
              <Button
                variant={floatingColor === 'tertiary' ? 'filled' : 'outlined'}
                onClick={() => setFloatingColor('tertiary')}
              >
                Tertiary
              </Button>
              <Button
                variant={floatingColor === 'surface' ? 'filled' : 'outlined'}
                onClick={() => setFloatingColor('surface')}
              >
                Surface
              </Button>
            </div>
          </div>

          <Toolbar
            variant="floating"
            position={floatingPosition}
            visible={showFloatingToolbar}
            colorTheme={floatingColor}
            items={[
              { icon: 'download', onClick: handleToolbarAction },
              { icon: 'email', onClick: handleToolbarAction },
              { icon: 'delete', onClick: handleToolbarAction },
              { icon: 'alarm', onClick: handleToolbarAction },
              { icon: 'star', onClick: handleToolbarAction },
            ]}
          />
        </CatalogCard>

        <CatalogCard title="Fixed Toolbar" style={{ overflow: 'visible' } as React.CSSProperties}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Visibility Control */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button variant="filled" onClick={() => setShowFixedToolbar(!showFixedToolbar)}>
                {showFixedToolbar ? 'Hide' : 'Show'} Fixed Toolbar
              </Button>
            </div>

            {/* Position Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px' }}>Position:</span>
              <Button
                variant={fixedPosition === 'top' ? 'filled' : 'outlined'}
                onClick={() => setFixedPosition('top')}
              >
                Top
              </Button>
              <Button
                variant={fixedPosition === 'bottom' ? 'filled' : 'outlined'}
                onClick={() => setFixedPosition('bottom')}
              >
                Bottom
              </Button>
              <Button
                variant={fixedPosition === 'left' ? 'filled' : 'outlined'}
                onClick={() => setFixedPosition('left')}
              >
                Left
              </Button>
              <Button
                variant={fixedPosition === 'right' ? 'filled' : 'outlined'}
                onClick={() => setFixedPosition('right')}
              >
                Right
              </Button>
            </div>

            {/* Color Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px' }}>Color:</span>
              <Button
                variant={fixedColor === 'primary' ? 'filled' : 'outlined'}
                onClick={() => setFixedColor('primary')}
              >
                Primary
              </Button>
              <Button
                variant={fixedColor === 'secondary' ? 'filled' : 'outlined'}
                onClick={() => setFixedColor('secondary')}
              >
                Secondary
              </Button>
              <Button
                variant={fixedColor === 'tertiary' ? 'filled' : 'outlined'}
                onClick={() => setFixedColor('tertiary')}
              >
                Tertiary
              </Button>
              <Button
                variant={fixedColor === 'surface' ? 'filled' : 'outlined'}
                onClick={() => setFixedColor('surface')}
              >
                Surface
              </Button>
            </div>
          </div>

          <Toolbar
            variant="fixed"
            position={fixedPosition}
            visible={showFixedToolbar}
            colorTheme={fixedColor}
            items={[
              { icon: 'arrow_back', onClick: handleToolbarAction },
              { icon: 'arrow_forward', onClick: handleToolbarAction },
              { icon: 'add', onClick: handleToolbarAction },
              { icon: 'grid_view', onClick: handleToolbarAction },
              { icon: 'more_vert', onClick: handleToolbarAction },
            ]}
          />
        </CatalogCard>
      </Section>
    </div>
  );
}
