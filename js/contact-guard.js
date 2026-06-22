(() => {
  const contacts = {
    main: [105, 110, 102, 111, 64, 103, 101, 98, 97, 101, 117, 100, 101, 116, 101, 99, 104, 110, 105, 107, 45, 109, 117, 114, 105, 113, 105, 46, 100, 101],
  };

  document.querySelectorAll(".protected-mail").forEach((node) => {
    node.addEventListener("click", () => {
      const chars = contacts[node.dataset.contactKey];
      if (!chars) return;

      const target = String.fromCharCode(...chars);

      const label = node.querySelector("strong") || node;
      label.textContent = target;
      window.location.href = ["mail", "to", ":", target].join("");
    });
  });

  document.querySelectorAll(".contact-form").forEach((form) => {
    const started = Date.now();
    const startedField = form.querySelector('[name="started"]');
    const status = form.querySelector(".form-status");
    const button = form.querySelector('[type="submit"]');
    let lastSent = 0;

    if (startedField) {
      startedField.value = String(started);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const elapsed = Date.now() - started;
      const now = Date.now();
      const trap = form.querySelector('[name="company_url"]');

      status?.classList.remove("is-error", "is-success");

      if (trap?.value) {
        return;
      }

      if (elapsed < 3500) {
        if (status) {
          status.textContent = "Bitte nehmen Sie sich kurz Zeit für Ihre Anfrage.";
          status.classList.add("is-error");
        }
        return;
      }

      if (now - lastSent < 15000) {
        if (status) {
          status.textContent = "Bitte warten Sie kurz, bevor Sie erneut senden.";
          status.classList.add("is-error");
        }
        return;
      }

      lastSent = now;
      if (button) button.disabled = true;
      if (status) status.textContent = "Anfrage wird gesendet...";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });

        if (!response.ok) {
          throw new Error("request failed");
        }

        form.reset();
        if (startedField) startedField.value = String(Date.now());
        if (status) {
          status.textContent = "Danke, Ihre Anfrage wurde gesendet.";
          status.classList.add("is-success");
        }
      } catch {
        if (status) {
          status.textContent = "Senden nicht möglich. Bitte versuchen Sie es später erneut.";
          status.classList.add("is-error");
        }
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
})();
