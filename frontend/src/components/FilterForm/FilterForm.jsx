import "./FilterForm.css";

function FilterForm({ country, setCountry }) {
    const handleChange = (e) => setCountry(e.target.value);

    return (
        <fieldset className="formular__filter-area">
            <legend className="formular__filter-legend">Фильтр</legend>
            <form className="formular__filter-form" onSubmit={(e) => e.preventDefault()}>
                <div className="custom-input">
                    <input
                        className="custom-input__field"
                        type="text"
                        name="country"
                        id="filter-country"
                        value={country}
                        onChange={handleChange}
                    />
                    <label className="custom-input__label" htmlFor="filter-country">
                        Страна
                    </label>
                </div>
            </form>
        </fieldset>
    );
}

export default FilterForm;