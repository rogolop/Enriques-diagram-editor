# Enriques diagram editor
[Enriques diagram editor](https://rogolop.github.io/Enriques-diagram-editor/) is a web-based graphical editor for Enriques diagrams.

## Features
- Create and edit an Enriques diagram using the graphical interface.
- Download the Enriques diagram as a TikZ or SVG file.
- Available online [here](https://rogolop.github.io/Enriques-diagram-editor/).

## Tips
### How to include the downloaded TikZ file in LaTeX
A TikZ file is a plain text file containing a `tikzpicture` LaTeX environment from the [pgf/tikz package](https://ctan.org/pkg/pgf), which describes a vector image. It can be embedded into a LaTeX document using the `\input` command. Alternatively, its contents can be copied directly into the document.

Example:
```Latex
\documentclass[12pt]{article}
\usepackage{tikz}
\begin{document}

\begin{figure}[htbp]
    \centering
    \resizebox{0.5\linewidth}{!}{\input{diagram.tikz}} % image here
    \caption{An Enriques diagram.}
\end{figure}

\end{document}
```

### How to include the downloaded SVG file in LaTeX
An SVG file is a plain text file defining a vector image in the SVG format (an XML-based  format compatible with browsers). It can be embedded into a LaTeX document using the `\includesvg` command of the [svg package](https://ctan.org/pkg/svg) (this package needs the compile option `--shell-escape` and depends on [Inkscape](https://inkscape.org/)).

Example:
```Latex
\documentclass[12pt]{article}
\usepackage{svg}
\begin{document}

\begin{figure}[htbp]
    \centering
    \includesvg[width=0.5\linewidth]{diagram.svg} % image here
    \caption{An Enriques diagram from an SVG file.}
\end{figure}

\end{document}
```


