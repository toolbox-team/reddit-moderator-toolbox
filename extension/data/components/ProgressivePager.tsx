import {type ReactNode, useRef} from 'react';
import type {MaybeAsyncIterable} from '../util/iter';

import {progressivePager} from '../tbui';
import {JQueryRenderer} from '../util/ui_interop';

// TODO: reimplement in pure React
export const ProgressivePager = ({
    lazy = true,
    preloadNext = true,
    controlPosition = 'top',
    emptyContent,
    pages,
}: {
    lazy: boolean;
    preloadNext: boolean;
    controlPosition: 'top' | 'bottom';
    emptyContent: ReactNode;
    pages: MaybeAsyncIterable<ReactNode>;
}) => {
    return <JQueryRenderer content={progressivePager({lazy, preloadNext, controlPosition, emptyContent}, pages)} />;
};
