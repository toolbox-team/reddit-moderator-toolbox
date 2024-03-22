import {ReactNode, useState} from 'react';

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
        <div className={`tb-window-tabs-wrapper ${vertical ? 'tb-window-tabs-wrapper-vertical' : ''}`}>
            <div className='tb-window-tabs'>
                {tabs.map((tab, i) => (
                    <a
                        key={i}
                        title={tab.tooltip}
                        onClick={() => setActiveIndex(i)}
                        className={activeIndex === i ? 'active' : undefined}
                    >
                        {tab.title}
                    </a>
                ))}
            </div>
            <div className='tb-window-tabs-content'>
                {tabs[activeIndex].content}
            </div>
        </div>
    );
};
