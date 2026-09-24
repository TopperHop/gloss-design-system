/*
 * Gloss autocomplete is intentionally independent of UIkit internals. It is
 * appended to the generated Gloss bundle after UIkit has been transformed.
 */
(() => {
    const Gloss = globalThis.Gloss;
    const instances = new WeakMap();
    let identifier = 0;

    const nextIdentifier = (prefix) => {
        identifier += 1;
        return `${prefix}-${identifier}`;
    };

    const dispatch = (element, type, detail) => {
        element.dispatchEvent(
            new CustomEvent(`gls-autocomplete:${type}`, {
                bubbles: true,
                detail,
            }),
        );
    };

    const getOptions = (list) => [...list.querySelectorAll('.gls-autocomplete-option')];

    const createAutocomplete = (element, options = {}) => {
        if (instances.has(element)) {
            return instances.get(element);
        }

        const input = element.querySelector('.gls-autocomplete-input');
        const list = element.querySelector('.gls-autocomplete-list');

        if (!input || !list) {
            console.warn('Gloss autocomplete requires an input and option list.', element);
            return undefined;
        }

        const multiSelect = options.multiSelect ?? element.hasAttribute('multi-select');
        const showOptions = options.showOptions ?? element.hasAttribute('show-options');
        const selectedArea = element.querySelector('.gls-autocomplete-badges');
        let activeOption;

        list.id ||= nextIdentifier('gls-autocomplete');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-controls', list.id);
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('role', 'combobox');
        list.setAttribute('role', 'listbox');

        const setOpen = (isOpen) => {
            list.hidden = !isOpen;
            input.setAttribute('aria-expanded', String(isOpen));
        };

        const setActiveOption = (option) => {
            activeOption?.classList.remove('gls-autocomplete-option-highlight');
            activeOption = option;

            if (!activeOption) {
                input.removeAttribute('aria-activedescendant');
                return;
            }

            activeOption.classList.add('gls-autocomplete-option-highlight');
            activeOption.id ||= nextIdentifier('gls-autocomplete-option');
            input.setAttribute('aria-activedescendant', activeOption.id);
            activeOption.scrollIntoView({ block: 'nearest' });
        };

        const visibleOptions = () => getOptions(list).filter((option) => !option.hidden);

        const filter = () => {
            const term = input.value.trim().toLowerCase();

            getOptions(list).forEach((option) => {
                option.hidden = !option.textContent.toLowerCase().includes(term);
            });

            setActiveOption(undefined);
            setOpen(visibleOptions().length > 0);
        };

        const removeSelection = (value) => {
            const option = getOptions(list).find((item) => item.dataset.value === value);
            option?.classList.remove('gls-autocomplete-option-selected');
            option?.setAttribute('aria-selected', 'false');

            const badge = [...(selectedArea?.querySelectorAll('.gls-autocomplete-badge') || [])].find(
                (item) => item.dataset.value === value,
            );
            badge?.remove();
            dispatch(element, 'remove', { value });
        };

        const select = (option) => {
            const value = option.dataset.value ?? option.textContent.trim();
            const text = option.textContent.trim();

            if (!multiSelect) {
                input.value = text;
                setOpen(false);
                input.dispatchEvent(new Event('change', { bubbles: true }));
                dispatch(element, 'select', { value, text });
                return;
            }

            if (!selectedArea) {
                console.warn('Gloss multi-select autocomplete requires .gls-autocomplete-badges.', element);
                return;
            }

            if (option.classList.contains('gls-autocomplete-option-selected')) {
                removeSelection(value);
                return;
            }

            option.classList.add('gls-autocomplete-option-selected');
            option.setAttribute('aria-selected', 'true');

            const badge = document.createElement('span');
            badge.className = 'gls-autocomplete-badge';
            badge.dataset.value = value;
            badge.append(`${text} `);

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'gls-autocomplete-badge-close';
            removeButton.setAttribute('aria-label', `Remove ${text}`);
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => removeSelection(value));

            badge.append(removeButton);
            selectedArea.append(badge);
            dispatch(element, 'select', { value, text });
        };

        const onDocumentClick = (event) => {
            if (!element.contains(event.target)) {
                setOpen(false);
            }
        };

        input.addEventListener('click', () => setOpen(!list.hidden));
        input.addEventListener('input', filter);
        input.addEventListener('keydown', (event) => {
            const options = visibleOptions();
            const index = options.indexOf(activeOption);

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveOption(options[Math.min(index + 1, options.length - 1)]);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveOption(options[Math.max(index - 1, 0)]);
            } else if (event.key === 'Enter' && activeOption) {
                event.preventDefault();
                select(activeOption);
            } else if (event.key === 'Escape') {
                setOpen(false);
                input.removeAttribute('aria-activedescendant');
            }
        });

        list.addEventListener('click', (event) => {
            const option = event.target.closest('.gls-autocomplete-option');
            if (option && list.contains(option)) {
                select(option);
            }
        });

        document.addEventListener('click', onDocumentClick);
        setOpen(showOptions);

        const instance = {
            destroy() {
                document.removeEventListener('click', onDocumentClick);
                instances.delete(element);
            },
        };

        instances.set(element, instance);
        return instance;
    };

    const initialize = (root = document) => {
        const elements = root.matches?.('.gls-autocomplete') ? [root] : root.querySelectorAll?.('.gls-autocomplete');
        elements?.forEach((element) => createAutocomplete(element));
    };

    if (Gloss) {
        Gloss.autocomplete = createAutocomplete;
        Gloss.autocomplete.initialize = initialize;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
    } else {
        initialize();
    }
})();
