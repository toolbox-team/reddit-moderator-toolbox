import {type ReactNode, useEffect, useMemo, useState} from 'react';
import type {MaybeAsyncIterable} from '../util/iter';
import {classes} from '../util/ui_interop';
import {GeneralButton} from './controls';
import css from './Pager.module.css';

/**
 * Takes an iterable of multiple sequential pages of content and displays one at
 * a time, with a row of buttons to move between pages.
 */
// TODO: this implementation no longer uses the `wrapWithLastValue` helper which
//       means the "load more" button will sometimes do nothing. This isn't
//       ideal; it's probably not the largest of the UX issues with this
//       particular interface at the moment, but
export const Pager = ({
    lazy = true,
    controlPosition = 'top',
    emptyContent,
    pages,
}: {
    /**
     * If true, not all pages will be pulled from the iterable at once. The
     * final page count won't be known; a "load more" button will be displayed
     * to attempt to load the next page. Good for asynchronous iterators where
     * computing the next page is expensive and not all pages will be needed.
     */
    lazy: boolean;
    /** Where the controls are displayed relative to the page content. */
    controlPosition: 'top' | 'bottom';
    /** Content to display in case the given iterable returns no pages. */
    emptyContent: ReactNode;
    /** An iterable of pages to be displayed. */
    pages: MaybeAsyncIterable<ReactNode>;
}) => {
    // Extract the iterator from the iterable we're passed in
    const iterator = useMemo(() => {
        if (Symbol.asyncIterator in pages) {
            return pages[Symbol.asyncIterator]();
        }
        return pages[Symbol.iterator]();
    }, [pages]);

    // Store the pages we've read from the iterator
    const [cachedPages, setCachedPages] = useState([] as ReactNode[]);
    // Keep track of whether the iterator has finished
    const [pagesDone, setPagesDone] = useState(false);
    // The page we're currently looking at
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Reset our page cache and start over from the first page if we ever end up
    // working with a different iterator
    useEffect(() => {
        setCachedPages([]);
        setPagesDone(false);
        setCurrentPageIndex(0);
    }, [iterator]);

    // Keep track of whether we're already loading a page so we don't attempt to
    // load two pages at the same time
    const [awaitingNextPage, setAwaitingNextPage] = useState(false);

    /** Loads the next value from the iterator into our page cache. */
    async function cacheNextPage () {
        if (pagesDone) {
            return;
        }
        if (awaitingNextPage) {
            return;
        }

        setAwaitingNextPage(true);
        const {value, done} = await iterator.next();
        if (done) {
            setPagesDone(true);
        } else {
            setCachedPages(pages => [...pages, value]);
        }
        setAwaitingNextPage(false);
    }

    // Pull new pages off our iterator as needed
    useEffect(() => {
        // if we're not lazy, gotta cache 'em all
        if (!lazy && !pagesDone) {
            cacheNextPage();
            return;
        }

        if (currentPageIndex >= cachedPages.length) {
            // We're looking at a page we don't have cached
            if (pagesDone) {
                // There are no more pages to load, so we can never see this
                // page; snap back to the last available page (if we have *no*
                // pages then we go to page 0 and display the `emptyContent`)
                setCurrentPageIndex(Math.max(0, cachedPages.length - 1));
            } else {
                // Cache additional pages until we get the one we want
                cacheNextPage();
            }
        }
    }, [lazy, cachedPages, pagesDone, currentPageIndex]);

    // Render the current page
    const currentPage = useMemo(() => {
        // if we've already received this page, display it - easy
        if (currentPageIndex < cachedPages.length) {
            return cachedPages[currentPageIndex];
        }

        if (pagesDone) {
            if (!cachedPages.length) {
                // if there are *no* pages to show, display the `emptyContent`
                return emptyContent;
            }

            // if we don't have this page and can't get more, display an error.
            // this should basically never be seen since we immediately set the
            // index back to the last page in the effect above, but shrug
            return <p>Error: there is no {currentPageIndex}th page</p>;
        }

        // if we *can* get more pages, display a loading state while we work
        // TODO: this state flashes pretty harshly when loading the next page
        //       happens quickly; we probably want to keep track of which page
        //       the user was looking at previously and just continue displaying
        //       that instead of a loading state
        return <p>Loading...</p>;
    }, [cachedPages, pagesDone, currentPageIndex]);

    // Render the controls
    const controls = (
        <div className={css.controls}>
            {/* a button for each page we've already loaded */}
            {cachedPages.map((page, i) => (
                <GeneralButton
                    key={i}
                    className={classes(
                        css.control,
                        currentPageIndex === i && css.active,
                    )}
                    onClick={() => setCurrentPageIndex(i)}
                >
                    {i + 1}
                </GeneralButton>
            ))}
            {/* if we can still try to load more pages, a "load more" button to do that */}
            {pagesDone || (
                <GeneralButton
                    className={css.control}
                    onClick={() => setCurrentPageIndex(cachedPages.length)}
                >
                    load more...
                </GeneralButton>
            )}
        </div>
    );

    return (
        <div>
            {controlPosition === 'top' && controls}
            <div className={css.content}>
                {currentPage}
            </div>
            {controlPosition === 'bottom' && controls}
        </div>
    );
};
