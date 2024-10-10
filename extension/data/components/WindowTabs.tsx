import {ReactNode, useState} from 'react';
import {classes} from '../util/ui_interop';
import css from './WindowTabs.module.css';

export interface WindowTab {
    title: string;
    tooltip?: string;
    content: ReactNode;
}

export const WindowTabs = ({vertical = false, tabs, defaultTabIndex = 0}: {
    /** If true, tabs will be oriented vertically */
    vertical: boolean;
    /** List of tabs to display */
    tabs: WindowTab[];
    /** Index of the initially selected tab */
    defaultTabIndex: number;
}) => {
    const [activeIndex, setActiveIndex] = useState(Math.min(tabs.length, defaultTabIndex));

    return (
        <div className={classes(css.wrapper, vertical && css.vertical)}>
            <div className={css.tabs}>
                {tabs.map((tab, i) => (
                    <a
                        key={i}
                        title={tab.tooltip}
                        onClick={() => setActiveIndex(i)}
                        className={classes(activeIndex === i && css.active)}
                    >
                        {tab.title}
                    </a>
                ))}
            </div>
            <div className={css.content}>
                {tabs[activeIndex].content}
            </div>
        </div>
    );
};
