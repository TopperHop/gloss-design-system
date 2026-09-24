/*
 * Gloss autocomplete is intentionally independent of UIkit internals. It is
 * appended to the generated Gloss bundle after UIkit has been transformed.
 */
(function (Gloss) {
    const { $, $$ } = Gloss.util;
    const clsActive = 'gls-autocomplete-option-highlight';
    const clsSelected = 'gls-autocomplete-option-selected';
    const selBadge = '.gls-autocomplete-badge';
    const selInput = '.gls-autocomplete-input';
    const selList = '.gls-autocomplete-list';
    const selOption = '.gls-autocomplete-option';
    let identifier = 0;

    const nextIdentifier = (prefix) => `${prefix}-${++identifier}`;

    const getOptions = (list) => $$(selOption, list);

    const trigger = (element, type, detail) => {
        element.dispatchEvent(
            new CustomEvent(`gls-autocomplete:${type}`, {
                bubbles: true,
                detail,
            }),
        );
    };

    const Autocomplete = {
        props: {
            multiSelect: Boolean,
            showOptions: Boolean,
        },

        data: {
            multiSelect: false,
            showOptions: false,
        },

        connected() {
            this.input = $(selInput, this.$el);
            this.list = $(selList, this.$el);
            this.selectedArea = $('.gls-autocomplete-badges', this.$el);
            this.isMultiSelect = this.multiSelect || this.$el.hasAttribute('multi-select');
            this.isShowOptions = this.showOptions || this.$el.hasAttribute('show-options');

            if (!this.input || !this.list) {
                console.warn('Gloss autocomplete requires an input and option list.', this.$el);
                return;
            }

            this.list.id ||= nextIdentifier('gls-autocomplete');
            this.input.setAttribute('aria-autocomplete', 'list');
            this.input.setAttribute('aria-controls', this.list.id);
            this.input.setAttribute('aria-expanded', 'false');
            this.input.setAttribute('role', 'combobox');
            this.list.setAttribute('role', 'listbox');

            this.onInputClick = () => this.toggle();
            this.onInput = () => this.filter();
            this.onKeydown = (event) => this.keydown(event);
            this.onListClick = (event) => this.click(event);
            this.onDocumentClick = (event) => !this.$el.contains(event.target) && this.hide();

            this.input.addEventListener('click', this.onInputClick);
            this.input.addEventListener('input', this.onInput);
            this.input.addEventListener('keydown', this.onKeydown);
            this.list.addEventListener('click', this.onListClick);
            document.addEventListener('click', this.onDocumentClick);

            this.toggle(this.isShowOptions);
        },

        disconnected() {
            this.input?.removeEventListener('click', this.onInputClick);
            this.input?.removeEventListener('input', this.onInput);
            this.input?.removeEventListener('keydown', this.onKeydown);
            this.list?.removeEventListener('click', this.onListClick);
            document.removeEventListener('click', this.onDocumentClick);
        },

        methods: {
            toggle(show = this.list.hidden) {
                this.list.hidden = !show;
                this.input.setAttribute('aria-expanded', String(show));
            },

            show() {
                this.toggle(true);
            },

            hide() {
                this.toggle(false);
                this.setActive();
            },

            getVisibleOptions() {
                return getOptions(this.list).filter((option) => !option.hidden);
            },

            setActive(option) {
                this.activeOption?.classList.remove(clsActive);
                this.activeOption = option;

                if (!option) {
                    this.input.removeAttribute('aria-activedescendant');
                    return;
                }

                option.classList.add(clsActive);
                option.id ||= nextIdentifier('gls-autocomplete-option');
                this.input.setAttribute('aria-activedescendant', option.id);
                option.scrollIntoView({ block: 'nearest' });
            },

            filter() {
                const term = this.input.value.trim().toLowerCase();

                getOptions(this.list).forEach((option) => {
                    option.hidden = !option.textContent.toLowerCase().includes(term);
                });

                this.setActive();
                this.toggle(this.getVisibleOptions().length > 0);
            },

            keydown(event) {
                const options = this.getVisibleOptions();
                const index = options.indexOf(this.activeOption);

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    this.setActive(options[Math.min(index + 1, options.length - 1)]);
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.setActive(options[Math.max(index - 1, 0)]);
                } else if (event.key === 'Enter' && this.activeOption) {
                    event.preventDefault();
                    this.select(this.activeOption);
                } else if (event.key === 'Escape') {
                    this.hide();
                }
            },

            click(event) {
                const option = event.target.closest(selOption);

                if (option && this.list.contains(option)) {
                    this.select(option);
                }
            },

            select(option) {
                const value = option.dataset.value ?? option.textContent.trim();
                const text = option.textContent.trim();

                if (!this.isMultiSelect) {
                    this.input.value = text;
                    this.input.dispatchEvent(new Event('change', { bubbles: true }));
                    this.hide();
                    trigger(this.$el, 'select', { value, text });
                    return;
                }

                if (!this.selectedArea) {
                    console.warn(
                        'Gloss multi-select autocomplete requires .gls-autocomplete-badges.',
                        this.$el,
                    );
                    return;
                }

                if (option.classList.contains(clsSelected)) {
                    this.remove(value);
                    return;
                }

                option.classList.add(clsSelected);
                option.setAttribute('aria-selected', 'true');

                const badge = document.createElement('span');
                badge.className = 'gls-autocomplete-badge';
                badge.dataset.value = value;
                badge.append(`${text} `);

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'gls-autocomplete-badge-close';
                button.setAttribute('aria-label', `Remove ${text}`);
                button.textContent = '×';
                button.addEventListener('click', () => this.remove(value));

                badge.append(button);
                this.selectedArea.append(badge);
                trigger(this.$el, 'select', { value, text });
            },

            remove(value) {
                const option = getOptions(this.list).find((item) => item.dataset.value === value);
                const badge = [...this.selectedArea.querySelectorAll(selBadge)].find(
                    (item) => item.dataset.value === value,
                );

                option?.classList.remove(clsSelected);
                option?.setAttribute('aria-selected', 'false');
                badge?.remove();
                trigger(this.$el, 'remove', { value });
            },
        },
    };

    Gloss.component('autocomplete', Autocomplete);

    const initialize = (root = document) => {
        const elements = root.matches?.('.gls-autocomplete')
            ? [root]
            : root.querySelectorAll?.('.gls-autocomplete');

        elements?.forEach((element) => Gloss.autocomplete(element));
    };

    Gloss.autocomplete.initialize = initialize;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
    } else {
        initialize();
    }
})(globalThis.Gloss);
