/* Shared CWSP site menu: collapses the list on phones and keeps one dropdown open at a time. */
(function () {
  var nav = document.querySelector('.gnav');
  if (!nav) return;
  nav.classList.add('js');
  var toggle = nav.querySelector('.gnav-toggle');
  var groups = nav.querySelectorAll('.gnav-group details');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  Array.prototype.forEach.call(groups, function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      Array.prototype.forEach.call(groups, function (o) { if (o !== d) o.open = false; });
    });
  });
  document.addEventListener('click', function (e) {
    if (nav.contains(e.target)) return;
    Array.prototype.forEach.call(groups, function (d) { d.open = false; });
  });
  nav.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    Array.prototype.forEach.call(groups, function (d) {
      if (d.open) { d.open = false; d.querySelector('summary').focus(); }
    });
  });
})();
