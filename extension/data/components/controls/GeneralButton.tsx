import {type ComponentPropsWithoutRef} from 'react';

export const GeneralButton = ({className, ...props}: ComponentPropsWithoutRef<'button'>) => (
    <button className={`tb-general-button ${className}`} {...props} />
);
