type Benefit = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type CaseItem = {
  name: string;
  role: string;
  result: string;
};

const benefits: Benefit[] = [
  {
    title: "Система принятия решений",
    description:
      "Научитесь приоритизировать задачи по влиянию на метрики, чтобы команда перестала тушить пожары и сфокусировалась на росте."
  },
  {
    title: "Язык, понятный всем ролям",
    description:
      "Освоите единый формат постановки гипотез и задач для маркетинга, продукта и проекта, чтобы сократить конфликты и потери на согласованиях."
  },
  {
    title: "Портфель готовых инструментов",
    description:
      "Заберете шаблоны бэклога, фреймворки экспериментов и чек-листы запуска, которые можно внедрить уже на следующей рабочей неделе."
  }
];

const faqItems: FaqItem[] = [
  {
    question: "Подойдет ли курс без технического бэкграунда?",
    answer:
      "Да. Программа рассчитана на специалистов бизнеса: маркетологов, PM и PdM. Нужны базовые метрики и готовность применять подход в задачах."
  },
  {
    question: "Сколько времени нужно в неделю?",
    answer:
      "В среднем 4-6 часов: короткие модули, практические задания и разборы. Формат сделан так, чтобы совмещать обучение с полной занятостью."
  },
  {
    question: "Что будет после предзаписи?",
    answer:
      "Вы получите подтверждение, детали по старту потока и персональное предложение для ранней регистрации до официального запуска продаж."
  }
];

const cases: CaseItem[] = [
  {
    name: "Екатерина",
    role: "Product Manager",
    result: "Пересобрала онбординг: активация новых пользователей выросла на 24% за 2 спринта."
  },
  {
    name: "Илья",
    role: "Performance Маркетолог",
    result: "Выстроил цикл тестов креативов и офферов: CPL снизился на 19% без расширения бюджета."
  },
  {
    name: "Мария",
    role: "Project Manager",
    result: "Ускорила delivery команды: время от брифа до запуска сократилось с 12 до 7 дней."
  }
];

function renderBenefits(items: Benefit[]): string {
  return items
    .map(
      (item) => `
      <article class="benefit-card">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </article>
    `
    )
    .join("");
}

function renderFaq(items: FaqItem[]): string {
  return items
    .map(
      (item) => `
      <article class="faq-item">
        <h3>${item.question}</h3>
        <p>${item.answer}</p>
      </article>
    `
    )
    .join("");
}

function renderCases(items: CaseItem[]): string {
  return items
    .map(
      (item) => `
      <article class="case-card">
        <div class="avatar-placeholder">Фото клиента</div>
        <h3>${item.name}, ${item.role}</h3>
        <p>${item.result}</p>
      </article>
    `
    )
    .join("");
}

function renderApp(): string {
  return `
    <header class="top-nav">
      <div class="container">
        <div class="brand">ВАЙБКОДИНГ</div>
        <nav class="menu" aria-label="Навигация по лендингу">
          <a href="#hero">Главная</a>
          <a href="#proof">Результаты</a>
          <a href="#benefits">Выгоды</a>
          <a href="#faq">Вопросы</a>
          <a href="#cta">Заявка</a>
        </nav>
      </div>
    </header>

    <main>
      <section id="hero">
        <div class="container hero-wrap">
          <div class="hero-copy">
            <h1>Вайбкодинг: курс, который превращает идеи в управляемый рост</h1>
            <p class="lead">Для маркетологов, project и product менеджеров: соберите систему, где гипотезы быстрее доходят до результата, а команда говорит на одном языке цифр и решений.</p>
            <div class="hero-points">
              <span class="chip">6 недель практики</span>
              <span class="chip">живые разборы кейсов</span>
              <span class="chip">шаблоны для внедрения в работе</span>
            </div>
          </div>
          <aside class="hero-cta-box" aria-labelledby="hero-cta-title">
            <h2 id="hero-cta-title">Откройте ранний доступ и зафиксируйте спецусловия</h2>
            <p class="muted">Количество мест первого потока ограничено. Ранняя регистрация приоритетно попадает на старт и получает бонусные материалы.</p>
            <a class="btn btn-primary" href="#cta">Перейти к форме предзаписи</a>
          </aside>
        </div>
      </section>

      <section id="proof">
        <div class="container">
          <h2>Доказательства, что подход работает в реальных задачах</h2>
          <p class="lead">Ниже показатели и кейсы участников с похожими ролями: от хаотичных задач к прогнозируемому росту метрик и скорости релизов.</p>

          <div class="stats">
            <article class="stat-card">
              <div class="stat-value">+37%</div>
              <p>Средний рост конверсии в воронке у участников после внедрения фреймворка гипотез.</p>
            </article>
            <article class="stat-card">
              <div class="stat-value">-42%</div>
              <p>Снижение времени на запуск эксперимента благодаря готовым шаблонам и процессу приоритизации.</p>
            </article>
            <article class="stat-card">
              <div class="stat-value">4.8/5</div>
              <p>Оценка программы по итогам тестового потока среди маркетологов и менеджеров продуктов.</p>
            </article>
          </div>

          <div class="cases">
            ${renderCases(cases)}
          </div>
        </div>
      </section>

      <section id="benefits">
        <div class="container">
          <h2>Что вы получите на курсе и зачем это вам в работе</h2>
          <p class="lead">Этот блок закрывает главный вопрос "почему мне стоит идти": вы получаете не теорию, а практический рычаг роста в текущей роли.</p>
          <div class="benefits">
            ${renderBenefits(benefits)}
          </div>
        </div>
      </section>

      <section id="faq">
        <div class="container">
          <h2>Частые вопросы перед покупкой</h2>
          <p class="lead">Здесь ответы на типичные сомнения, которые обычно останавливают перед регистрацией.</p>
          <div class="faq">
            ${renderFaq(faqItems)}
          </div>
        </div>
      </section>

      <section id="cta">
        <div class="container">
          <h2>Оставьте заявку на курс «Вайбкодинг»</h2>
          <p class="lead">Финальный шаг: заполните форму, чтобы закрепить место в списке предрегистрации и получить условия раннего входа.</p>

          <div class="cta-layout">
            <article class="cta-note">
              <h3>Почему лучше оставить заявку сейчас</h3>
              <p class="muted">Предзапись дает приоритет при распределении мест, раннюю цену и доступ к полезному вводному материалу до старта программы.</p>
            </article>

            <article class="form-card">
              <h3>Форма предрегистрации</h3>
              <form id="lead-form" novalidate>
                <label for="name">Имя
                  <input id="name" name="name" type="text" placeholder="Введите ваше имя" required />
                </label>

                <label for="phone">Телефон
                  <input id="phone" name="phone" type="tel" placeholder="+79991234567" required />
                </label>

                <label class="consent" for="consent">
                  <input id="consent" name="consent" type="checkbox" required />
                  <span>Я согласен(а) на обработку персональных данных</span>
                </label>

                <button id="submit-btn" class="btn btn-primary" type="submit">Забронировать место в потоке</button>
                <p id="form-status" class="form-status" aria-live="polite"></p>
              </form>
            </article>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <div class="container">© 2026 Вайбкодинг. Предрегистрация на обучающий курс.</div>
    </footer>
  `;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function bindLeadForm(): void {
  const form = document.getElementById("lead-form") as HTMLFormElement | null;
  const nameInput = document.getElementById("name") as HTMLInputElement | null;
  const phoneInput = document.getElementById("phone") as HTMLInputElement | null;
  const consentInput = document.getElementById("consent") as HTMLInputElement | null;
  const submitButton = document.getElementById("submit-btn") as HTMLButtonElement | null;
  const statusElement = document.getElementById("form-status") as HTMLParagraphElement | null;

  if (!form || !nameInput || !phoneInput || !consentInput || !submitButton || !statusElement) {
    return;
  }

  const setStatus = (text: string, kind: "idle" | "loading" | "success" | "error"): void => {
    statusElement.textContent = text;
    statusElement.className = `form-status is-${kind}`;
  };

  phoneInput.addEventListener("input", () => {
    phoneInput.value = normalizePhone(phoneInput.value);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const phone = normalizePhone(phoneInput.value);
    phoneInput.value = phone;

    if (!name || !phone) {
      setStatus("Заполните обязательные поля: имя и телефон.", "error");
      return;
    }

    if (!/^\+\d+$/.test(phone)) {
      setStatus("Телефон должен начинаться с '+' и содержать только цифры.", "error");
      return;
    }

    if (!consentInput.checked) {
      setStatus("Подтвердите согласие на обработку персональных данных.", "error");
      return;
    }

    submitButton.disabled = true;
    setStatus("Отправка заявки...", "loading");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, phone })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        if (response.status === 409) {
          setStatus("Такой контакт уже зарегистрирован.", "error");
        } else {
          setStatus(payload.error ?? "Не удалось отправить заявку.", "error");
        }
        return;
      }

      form.reset();
      setStatus("Заявка успешно отправлена. Мы свяжемся с вами.", "success");
    } catch (_error) {
      setStatus("Ошибка сети. Повторите попытку через минуту.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

const appRoot = document.getElementById("app");

if (!appRoot) {
  throw new Error("App root #app not found");
}

appRoot.innerHTML = renderApp();
bindLeadForm();
