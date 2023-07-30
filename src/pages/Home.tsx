import React from 'react';
import qs from 'qs';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { setCategoryId, setCurrentPage, setFilters } from '../redux/slices/filterSlice';
import { fetchPizzas, SearchPizzaParams } from '../redux/slices/pizzasSlice';

import Categories from '../components/Categories';
import Sort, { list } from '../components/Sort';
import PizzaBlock from '../components/PizzaBlock';
import Skeleton from '../components/PizzaBlock/Skeleton';
import Pagination from '../components/Pagination';
import { RootState, useAppDispatch } from '../redux/store';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isSearch = React.useRef(false);
  const isMounted = React.useRef(false);

  const { items, status } = useSelector((state: RootState) => state.pizzas);
  const { categoryId, sort, currentPage, searchValue } = useSelector(
    (state: RootState) => state.filter,
  );

  const onCangeCategory = React.useCallback(
    (idx: number) => {
      dispatch(setCategoryId(idx));
    },
    [dispatch],
  );

  const onChangePage = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  React.useEffect(() => {
    const getPizzas = () => {
      const sortBy = sort.sortProperty.replace('-', '');
      const order = sort.sortProperty.includes('-') ? 'asc' : 'desc';
      const category = categoryId > 0 ? `&category=${categoryId}` : '';
      const search = searchValue ? `&search=${searchValue}` : '';

      dispatch(
        fetchPizzas({
          sortBy,
          order,
          category,
          search,
          currentPage: String(currentPage),
        }),
      );

      window.scrollTo(0, 0);
    };

    getPizzas();

    isSearch.current = false;
  }, [categoryId, sort.sortProperty, searchValue, currentPage, dispatch]);

  // Якщо змінили параметри та був перший рендер
  React.useEffect(() => {
    if (isMounted.current) {
      const queryString = qs.stringify({
        sortProperty: sort.sortProperty,
        categoryId,
        currentPage,
      });

      navigate(`?${queryString}`);
    }
    isMounted.current = true;
  }, [categoryId, sort.sortProperty, currentPage, navigate]);

  // Якщо був перший рендер то перевіряєм URL-параметри, та зберігаєм в redux
  React.useEffect(() => {
    if (window.location.search) {
      const params = qs.parse(window.location.search.substring(1)) as unknown as SearchPizzaParams;

      const sort = list.find((obj) => obj.sortProperty === params.sortBy);
      dispatch(
        setFilters({
          searchValue: params.search,
          categoryId: Number(params.category),
          currentPage: Number(params.currentPage),
          sort: sort ? sort : list[0],
        }),
      );
      isSearch.current = true;
      isMounted.current = true;
    }
  }, [dispatch]);

  const skeletons = [...new Array(4)].map((_, i) => <Skeleton key={i} />);

  const pizzasItems = items.map((obj) => <PizzaBlock key={obj.id} {...obj} />);

  return (
    <>
      <div className="content__top">
        <Categories catValue={categoryId} onCangeCategory={onCangeCategory} />
        <Sort value={sort} />
      </div>
      <h2 className="content__title">Усі піци</h2>
      {status === 'error' ? (
        <div className="content__error-info">
          <h2>Ой щось пішло не так 😕</h2>
          <p>На жаль, не вдалося завантажити піци. Спробуйте повторити спробу пізніше.</p>
        </div>
      ) : (
        <div className="content__items">{status === 'loading' ? skeletons : pizzasItems}</div>
      )}

      <Pagination currentPage={currentPage} onChangePage={onChangePage} />
    </>
  );
};

export default Home;
