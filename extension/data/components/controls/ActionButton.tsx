import {type ComponentPropsWithoutRef} from 'react';

export const ActionButton = ({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'button'> & {
    inline?: boolean;
}) => (
    <button
        className={`tb-action-button ${inline ? 'inline-button' : ''} ${className}`}
        {...props}
    />
);
